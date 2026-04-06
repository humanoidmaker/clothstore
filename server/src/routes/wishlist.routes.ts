import { Router, Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import ProductVariant from "../models/ProductVariant.js";
import { authenticate } from "../middleware/auth.js";
import { validate, validateQuery } from "../middleware/validate.js";
import { paginationHelper } from "../utils/helpers.js";
import { logger } from "../config/logger.js";

const router = Router();
router.use(authenticate);

// ── Schemas ──────────────────────────────────────────────────────────

const addWishlistSchema = z.object({
  productId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), "Invalid product ID"),
});

const wishlistQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

// ── GET / ────────────────────────────────────────────────────────────

router.get("/", validateQuery(wishlistQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query as any;
    const userId = req.user!.userId;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Wishlist.find({ userId })
        .populate({
          path: "productId",
          match: { isActive: true },
          populate: { path: "categoryId", select: "name slug" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Wishlist.countDocuments({ userId }),
    ]);

    // Filter out items where the product was deleted/deactivated
    const validItems = items.filter((item: any) => item.productId !== null);

    // Attach variants to each product
    const productIds = validItems
      .map((item: any) => item.productId?._id)
      .filter(Boolean);

    const variants = await ProductVariant.find({ productId: { $in: productIds } }).lean();
    const variantsByProduct = new Map<string, typeof variants>();
    for (const v of variants) {
      const key = v.productId.toString();
      if (!variantsByProduct.has(key)) variantsByProduct.set(key, []);
      variantsByProduct.get(key)!.push(v);
    }

    const enrichedItems = validItems.map((item: any) => ({
      ...item,
      productId: {
        ...item.productId,
        variants: variantsByProduct.get(item.productId._id.toString()) || [],
      },
    }));

    res.json({
      success: true,
      data: { wishlist: enrichedItems },
      pagination: paginationHelper(page, limit, total),
    });
  } catch (err) {
    logger.error(`Get wishlist error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── POST / ──────────────────────────────────────────────────────────

router.post("/", validate(addWishlistSchema), async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    const userId = req.user!.userId;

    // Verify product exists and is active
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      res.status(404).json({
        success: false,
        error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" },
      });
      return;
    }

    // Create (ignore duplicate via unique index)
    try {
      await Wishlist.create({ userId, productId });
    } catch (err: any) {
      if (err.code === 11000) {
        // Already in wishlist — treat as success
        res.json({ success: true, message: "Product is already in your wishlist." });
        return;
      }
      throw err;
    }

    res.status(201).json({ success: true, message: "Product added to wishlist." });
  } catch (err) {
    logger.error(`Add to wishlist error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── DELETE /:productId ──────────────────────────────────────────────

router.delete("/:productId", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const { productId } = req.params as { productId: string };

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_ID", message: "Invalid product ID" },
      });
      return;
    }

    const item = await Wishlist.findOneAndDelete({
      userId,
      productId,
    });

    if (!item) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_IN_WISHLIST", message: "Product is not in your wishlist" },
      });
      return;
    }

    res.json({ success: true, message: "Product removed from wishlist." });
  } catch (err) {
    logger.error(`Remove from wishlist error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

export default router;
