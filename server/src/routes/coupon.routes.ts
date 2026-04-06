import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate, validateQuery } from "../middleware/validate.js";
import { paginationHelper } from "../utils/helpers.js";
import { logger } from "../config/logger.js";
import Coupon from "../models/Coupon.js";

const router = Router();

// ── Validation schemas ────────────────────────────────────────────────

const validateCouponQuerySchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  subtotal: z.coerce.number().min(0, "Subtotal must be >= 0"),
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const createCouponSchema = z.object({
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive("Discount value must be positive"),
  minimumAmount: z.number().min(0).optional(),
  maximumDiscount: z.number().positive().nullable().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
});

const updateCouponSchema = createCouponSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ── GET /validate — Validate coupon code ─────────────────────────────

router.get(
  "/validate",
  authenticate,
  validateQuery(validateCouponQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { code, subtotal } = req.query as unknown as z.infer<typeof validateCouponQuerySchema>;

      const coupon = await Coupon.findOne({ code: code.toUpperCase() }).lean();

      if (!coupon) {
        res.json({
          success: true,
          data: { valid: false, discount: 0, coupon: null },
          message: "Coupon not found",
        });
        return;
      }

      // Check active
      if (!coupon.isActive) {
        res.json({
          success: true,
          data: { valid: false, discount: 0, coupon: null },
          message: "Coupon is inactive",
        });
        return;
      }

      // Check date validity
      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        res.json({
          success: true,
          data: { valid: false, discount: 0, coupon: null },
          message: "Coupon has expired or is not yet valid",
        });
        return;
      }

      // Check usage limit
      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        res.json({
          success: true,
          data: { valid: false, discount: 0, coupon: null },
          message: "Coupon usage limit reached",
        });
        return;
      }

      // Check minimum amount
      if (subtotal < coupon.minimumAmount) {
        res.json({
          success: true,
          data: { valid: false, discount: 0, coupon: null },
          message: `Minimum order amount is ₹${coupon.minimumAmount}`,
        });
        return;
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discountType === "PERCENTAGE") {
        discount = (coupon.discountValue * subtotal) / 100;
        if (coupon.maximumDiscount !== null) {
          discount = Math.min(discount, coupon.maximumDiscount);
        }
      } else {
        discount = coupon.discountValue;
      }
      discount = Math.min(discount, subtotal);

      res.json({
        success: true,
        data: {
          valid: true,
          discount: Math.round(discount * 100) / 100,
          coupon: {
            code: coupon.code,
            description: coupon.description,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            minimumAmount: coupon.minimumAmount,
            maximumDiscount: coupon.maximumDiscount,
          },
        },
      });
    } catch (err) {
      logger.error(`Validate coupon error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to validate coupon" },
      });
    }
  }
);

// ── Admin routes ─────────────────────────────────────────────────────

// GET / — List all coupons
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  validateQuery(paginationQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { page, limit } = req.query as unknown as z.infer<typeof paginationQuerySchema>;
      const skip = (page - 1) * limit;

      const [coupons, total] = await Promise.all([
        Coupon.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Coupon.countDocuments(),
      ]);

      res.json({
        success: true,
        data: coupons,
        pagination: paginationHelper(page, limit, total),
      });
    } catch (err) {
      logger.error(`List coupons error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to fetch coupons" },
      });
    }
  }
);

// POST / — Create coupon
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createCouponSchema),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;

      const existing = await Coupon.findOne({ code: data.code.toUpperCase() });
      if (existing) {
        res.status(409).json({
          success: false,
          error: { code: "DUPLICATE_CODE", message: "A coupon with this code already exists" },
        });
        return;
      }

      const coupon = await Coupon.create({
        code: data.code.toUpperCase(),
        description: data.description || "",
        discountType: data.discountType,
        discountValue: data.discountValue,
        minimumAmount: data.minimumAmount || 0,
        maximumDiscount: data.maximumDiscount ?? null,
        usageLimit: data.usageLimit ?? null,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
      });

      res.status(201).json({
        success: true,
        data: coupon,
        message: "Coupon created successfully",
      });
    } catch (err) {
      logger.error(`Create coupon error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to create coupon" },
      });
    }
  }
);

// PUT /:id — Update coupon
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(updateCouponSchema),
  async (req: Request, res: Response) => {
    try {
      const data = req.body;

      // Uppercase code if provided
      if (data.code) {
        data.code = data.code.toUpperCase();
      }

      const coupon = await Coupon.findByIdAndUpdate(
        req.params.id,
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!coupon) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Coupon not found" },
        });
        return;
      }

      res.json({
        success: true,
        data: coupon,
        message: "Coupon updated successfully",
      });
    } catch (err) {
      logger.error(`Update coupon error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to update coupon" },
      });
    }
  }
);

// DELETE /:id — Delete coupon
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const coupon = await Coupon.findByIdAndDelete(req.params.id);

      if (!coupon) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Coupon not found" },
        });
        return;
      }

      res.json({
        success: true,
        message: "Coupon deleted successfully",
      });
    } catch (err) {
      logger.error(`Delete coupon error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to delete coupon" },
      });
    }
  }
);

export default router;
