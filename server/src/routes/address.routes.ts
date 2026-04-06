import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { logger } from "../config/logger.js";
import Address from "../models/Address.js";

const router = Router();
router.use(authenticate);

// ── Validation schemas ────────────────────────────────────────────────

const createAddressSchema = z.object({
  fullName: z.string().min(1, "Full name is required").trim(),
  phone: z.string().min(1, "Phone is required"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  country: z.string().optional(),
  type: z.enum(["HOME", "WORK", "OTHER"]).optional(),
  isDefault: z.boolean().optional(),
});

const updateAddressSchema = createAddressSchema.partial();

// ── GET / — List user's addresses ────────────────────────────────────

router.get("/", async (req: Request, res: Response) => {
  try {
    const addresses = await Address.find({ userId: req.user!.userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: addresses,
    });
  } catch (err) {
    logger.error(`List addresses error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to fetch addresses" },
    });
  }
});

// ── POST / — Create address ──────────────────────────────────────────

router.post(
  "/",
  validate(createAddressSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const data = req.body;

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await Address.updateMany({ userId, isDefault: true }, { isDefault: false });
      }

      const address = await Address.create({
        userId,
        fullName: data.fullName,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || "",
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: data.country || "India",
        type: data.type || "HOME",
        isDefault: data.isDefault || false,
      });

      res.status(201).json({
        success: true,
        data: address,
        message: "Address created successfully",
      });
    } catch (err) {
      logger.error(`Create address error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to create address" },
      });
    }
  }
);

// ── PUT /:id — Update address ────────────────────────────────────────

router.put(
  "/:id",
  validate(updateAddressSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;

      const address = await Address.findOne({ _id: req.params.id, userId });
      if (!address) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Address not found" },
        });
        return;
      }

      const data = req.body;

      // If setting as default, unset other defaults
      if (data.isDefault) {
        await Address.updateMany(
          { userId, _id: { $ne: address._id }, isDefault: true },
          { isDefault: false }
        );
      }

      Object.assign(address, data);
      await address.save();

      res.json({
        success: true,
        data: address,
        message: "Address updated successfully",
      });
    } catch (err) {
      logger.error(`Update address error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to update address" },
      });
    }
  }
);

// ── DELETE /:id — Delete address ─────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const address = await Address.findOne({ _id: req.params.id, userId });
    if (!address) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Address not found" },
      });
      return;
    }

    const wasDefault = address.isDefault;
    await Address.deleteOne({ _id: address._id });

    // If deleted address was default, make the most recent remaining address default
    if (wasDefault) {
      const nextDefault = await Address.findOne({ userId }).sort({ createdAt: -1 });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }

    res.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (err) {
    logger.error(`Delete address error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to delete address" },
    });
  }
});

// ── PUT /:id/default — Set address as default ────────────────────────

router.put("/:id/default", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const address = await Address.findOne({ _id: req.params.id, userId });
    if (!address) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Address not found" },
      });
      return;
    }

    // Unset all other defaults
    await Address.updateMany(
      { userId, _id: { $ne: address._id }, isDefault: true },
      { isDefault: false }
    );

    address.isDefault = true;
    await address.save();

    res.json({
      success: true,
      data: address,
      message: "Default address updated",
    });
  } catch (err) {
    logger.error(`Set default address error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to set default address" },
    });
  }
});

export default router;
