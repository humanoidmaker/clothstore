import { Router, Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate, validateQuery } from "../middleware/validate.js";
import { paginationHelper } from "../utils/helpers.js";
import { logger } from "../config/logger.js";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";

const router = Router();

// ── Validation schemas ────────────────────────────────────────────────

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const createReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().optional(),
  comment: z.string().optional(),
});

const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sort: z.enum(["createdAt", "-createdAt", "rating", "-rating"]).default("-createdAt"),
});

// ── Helper: recalculate product avg rating ────────────────────────────

async function recalculateProductRating(productId: string | mongoose.Types.ObjectId): Promise<void> {
  const result = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(String(productId)) } },
    {
      $group: {
        _id: "$productId",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Product.updateOne(
      { _id: productId },
      {
        avgRating: Math.round(result[0].avgRating * 10) / 10,
        reviewCount: result[0].reviewCount,
      }
    );
  } else {
    await Product.updateOne(
      { _id: productId },
      { avgRating: 0, reviewCount: 0 }
    );
  }
}

// ── GET /product/:productId — Public: reviews for a product ──────────

router.get(
  "/product/:productId",
  validateQuery(paginationQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const { page, limit } = req.query as unknown as z.infer<typeof paginationQuerySchema>;
      const skip = (page - 1) * limit;

      const filter = { productId };

      const [reviews, total] = await Promise.all([
        Review.find(filter)
          .populate("userId", "firstName lastName avatar")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Review.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: reviews,
        pagination: paginationHelper(page, limit, total),
      });
    } catch (err) {
      logger.error(`List reviews error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to fetch reviews" },
      });
    }
  }
);

// ── POST / — Create review ───────────────────────────────────────────

router.post(
  "/",
  authenticate,
  validate(createReviewSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { productId, rating, title, comment } = req.body;

      // Check product exists
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Product not found" },
        });
        return;
      }

      // Check duplicate review (unique index will also catch this)
      const existingReview = await Review.findOne({ userId, productId });
      if (existingReview) {
        res.status(409).json({
          success: false,
          error: { code: "DUPLICATE_REVIEW", message: "You have already reviewed this product" },
        });
        return;
      }

      // Check if user has purchased and received the product
      let isVerified = false;
      const deliveredOrders = await Order.find({
        userId,
        status: "DELIVERED",
      }).select("_id");

      if (deliveredOrders.length > 0) {
        const orderIds = deliveredOrders.map((o) => o._id);
        const purchasedItem = await OrderItem.findOne({
          orderId: { $in: orderIds },
          productSlug: product.slug,
        });
        if (purchasedItem) {
          isVerified = true;
        }
      }

      const review = await Review.create({
        userId,
        productId,
        rating,
        title: title || "",
        comment: comment || "",
        isVerified,
      });

      await recalculateProductRating(productId);

      const populated = await Review.findById(review._id)
        .populate("userId", "firstName lastName avatar")
        .lean();

      res.status(201).json({
        success: true,
        data: populated,
        message: "Review created successfully",
      });
    } catch (err) {
      logger.error(`Create review error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to create review" },
      });
    }
  }
);

// ── PUT /:id — Update own review ─────────────────────────────────────

router.put(
  "/:id",
  authenticate,
  validate(updateReviewSchema),
  async (req: Request, res: Response) => {
    try {
      const review = await Review.findById(req.params.id);

      if (!review) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Review not found" },
        });
        return;
      }

      if (String(review.userId) !== req.user!.userId) {
        res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "You can only edit your own reviews" },
        });
        return;
      }

      const { rating, title, comment } = req.body;
      if (rating !== undefined) review.rating = rating;
      if (title !== undefined) review.title = title;
      if (comment !== undefined) review.comment = comment;

      await review.save();
      await recalculateProductRating(review.productId);

      const populated = await Review.findById(review._id)
        .populate("userId", "firstName lastName avatar")
        .lean();

      res.json({
        success: true,
        data: populated,
        message: "Review updated successfully",
      });
    } catch (err) {
      logger.error(`Update review error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to update review" },
      });
    }
  }
);

// ── DELETE /:id — Delete review (own or admin) ───────────────────────

router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Review not found" },
      });
      return;
    }

    if (req.user!.role !== "ADMIN" && String(review.userId) !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied" },
      });
      return;
    }

    const productId = review.productId;
    await Review.deleteOne({ _id: review._id });
    await recalculateProductRating(productId);

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (err) {
    logger.error(`Delete review error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to delete review" },
    });
  }
});

// ── GET / — Admin: list all reviews ──────────────────────────────────

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  validateQuery(adminListQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { page, limit, rating, sort } = req.query as unknown as z.infer<typeof adminListQuerySchema>;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = {};
      if (rating) filter.rating = rating;

      // Parse sort string
      let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
      if (sort) {
        const desc = sort.startsWith("-");
        const field = desc ? sort.slice(1) : sort;
        sortObj = { [field]: desc ? -1 : 1 };
      }

      const [reviews, total] = await Promise.all([
        Review.find(filter)
          .populate("userId", "firstName lastName email avatar")
          .populate("productId", "name slug")
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        Review.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: reviews,
        pagination: paginationHelper(page, limit, total),
      });
    } catch (err) {
      logger.error(`Admin list reviews error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to fetch reviews" },
      });
    }
  }
);

export default router;
