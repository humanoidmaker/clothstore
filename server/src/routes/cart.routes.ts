import { Router, Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import CartItem from "../models/CartItem.js";
import ProductVariant from "../models/ProductVariant.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { logger } from "../config/logger.js";

const router = Router();
router.use(authenticate);

// ── Schemas ──────────────────────────────────────────────────────────

const addToCartSchema = z.object({
  variantId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), "Invalid variant ID"),
  quantity: z.number().int().min(1, "Minimum quantity is 1").max(10, "Maximum quantity is 10"),
});

const updateCartSchema = z.object({
  quantity: z.number().int().min(1, "Minimum quantity is 1").max(10, "Maximum quantity is 10"),
});

// ── Helper: get full cart + summary ─────────────────────────────────

async function getCartResponse(userId: string) {
  const items = await CartItem.find({ userId })
    .populate({
      path: "variantId",
      populate: {
        path: "productId",
        select: "name slug price compareAtPrice isActive",
        populate: { path: "categoryId", select: "name slug" },
      },
    })
    .sort({ createdAt: -1 })
    .lean();

  // Filter out items where the variant or product was deleted / deactivated
  const validItems = items.filter(
    (item: any) => item.variantId && item.variantId.productId && item.variantId.productId.isActive
  );

  let subtotal = 0;
  let itemCount = 0;

  for (const item of validItems) {
    const product = (item as any).variantId?.productId;
    if (product) {
      subtotal += product.price * item.quantity;
      itemCount += item.quantity;
    }
  }

  return {
    items: validItems,
    summary: { itemCount, subtotal },
  };
}

// ── GET / ────────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response) => {
  try {
    const cart = await getCartResponse(req.user!.userId);
    res.json({ success: true, data: cart });
  } catch (err) {
    logger.error(`Get cart error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── POST / ──────────────────────────────────────────────────────────

router.post("/", validate(addToCartSchema), async (req: Request, res: Response) => {
  try {
    const { variantId, quantity } = req.body;
    const userId = req.user!.userId;

    // Verify variant exists and has stock
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      res.status(404).json({
        success: false,
        error: { code: "VARIANT_NOT_FOUND", message: "Product variant not found" },
      });
      return;
    }

    if (variant.stock <= 0) {
      res.status(400).json({
        success: false,
        error: { code: "OUT_OF_STOCK", message: "This variant is currently out of stock" },
      });
      return;
    }

    // Upsert: if item exists, add quantity (capped at stock)
    const existing = await CartItem.findOne({ userId, variantId });

    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, variant.stock, 10);
      existing.quantity = newQty;
      await existing.save();
    } else {
      const cappedQty = Math.min(quantity, variant.stock, 10);
      await CartItem.create({ userId, variantId, quantity: cappedQty });
    }

    const cart = await getCartResponse(userId);
    res.json({ success: true, data: cart, message: "Item added to cart." });
  } catch (err) {
    logger.error(`Add to cart error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── PUT /:id ────────────────────────────────────────────────────────

router.put("/:id", validate(updateCartSchema), async (req: Request, res: Response) => {
  try {
    const { quantity } = req.body;
    const userId = req.user!.userId;

    const { id } = req.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Invalid cart item ID" },
      });
      return;
    }

    const cartItem = await CartItem.findOne({ _id: id, userId });
    if (!cartItem) {
      res.status(404).json({
        success: false,
        error: { code: "CART_ITEM_NOT_FOUND", message: "Cart item not found" },
      });
      return;
    }

    // Check stock
    const variant = await ProductVariant.findById(cartItem.variantId);
    if (!variant) {
      res.status(404).json({
        success: false,
        error: { code: "VARIANT_NOT_FOUND", message: "Product variant no longer exists" },
      });
      return;
    }

    if (quantity > variant.stock) {
      res.status(400).json({
        success: false,
        error: {
          code: "INSUFFICIENT_STOCK",
          message: `Only ${variant.stock} items available in stock`,
        },
      });
      return;
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    const cart = await getCartResponse(userId);
    res.json({ success: true, data: cart, message: "Cart updated." });
  } catch (err) {
    logger.error(`Update cart error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── DELETE /:id ─────────────────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const { id } = req.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Invalid cart item ID" },
      });
      return;
    }

    const cartItem = await CartItem.findOneAndDelete({ _id: id, userId });
    if (!cartItem) {
      res.status(404).json({
        success: false,
        error: { code: "CART_ITEM_NOT_FOUND", message: "Cart item not found" },
      });
      return;
    }

    const cart = await getCartResponse(userId);
    res.json({ success: true, data: cart, message: "Item removed from cart." });
  } catch (err) {
    logger.error(`Delete cart item error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── DELETE / (clear all) ────────────────────────────────────────────

router.delete("/", async (req: Request, res: Response) => {
  try {
    await CartItem.deleteMany({ userId: req.user!.userId });

    res.json({
      success: true,
      data: { items: [], summary: { itemCount: 0, subtotal: 0 } },
      message: "Cart cleared.",
    });
  } catch (err) {
    logger.error(`Clear cart error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

export default router;
