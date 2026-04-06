import { Router, Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateQuery } from "../middleware/validate.js";
import { paginationHelper } from "../utils/helpers.js";
import { logger } from "../config/logger.js";
import User from "../models/User.js";
import Address from "../models/Address.js";
import Order from "../models/Order.js";

const router = Router();
router.use(authenticate, authorize("ADMIN"));

// ── Validation schemas ────────────────────────────────────────────────

const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum(["CUSTOMER", "ADMIN"]).optional(),
});

// ── GET / — List all users with order stats ──────────────────────────

router.get(
  "/",
  validateQuery(listUsersQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { page, limit, search, role } = req.query as unknown as z.infer<typeof listUsersQuerySchema>;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = {};
      if (role) filter.role = role;
      if (search) {
        filter.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const [total, users] = await Promise.all([
        User.countDocuments(filter),
        User.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      // Aggregate order stats for these users
      const userIds = users.map((u) => u._id);
      const orderStats = await Order.aggregate([
        { $match: { userId: { $in: userIds }, paymentStatus: "PAID" } },
        {
          $group: {
            _id: "$userId",
            orderCount: { $sum: 1 },
            totalSpent: { $sum: "$total" },
          },
        },
      ]);

      const statsMap = new Map(
        orderStats.map((s) => [String(s._id), { orderCount: s.orderCount, totalSpent: s.totalSpent }])
      );

      const usersWithStats = users.map((user) => {
        const stats = statsMap.get(String(user._id)) || { orderCount: 0, totalSpent: 0 };
        return { ...user, orderCount: stats.orderCount, totalSpent: stats.totalSpent };
      });

      res.json({
        success: true,
        data: usersWithStats,
        pagination: paginationHelper(page, limit, total),
      });
    } catch (err) {
      logger.error(`List users error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to fetch users" },
      });
    }
  }
);

// ── GET /:id — Get user detail ───────────────────────────────────────

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).lean();

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "User not found" },
      });
      return;
    }

    const [addresses, recentOrders, orderStats] = await Promise.all([
      Address.find({ userId: user._id }).sort({ isDefault: -1, createdAt: -1 }).lean(),
      Order.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Order.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(String(user._id)), paymentStatus: "PAID" } },
        {
          $group: {
            _id: null,
            orderCount: { $sum: 1 },
            totalSpent: { $sum: "$total" },
          },
        },
      ]),
    ]);

    const stats = orderStats[0] || { orderCount: 0, totalSpent: 0 };

    res.json({
      success: true,
      data: {
        ...user,
        addresses,
        recentOrders,
        orderCount: stats.orderCount,
        totalSpent: stats.totalSpent,
      },
    });
  } catch (err) {
    logger.error(`Get user detail error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to fetch user details" },
    });
  }
});

// ── PUT /:id/toggle-status — Toggle user role ────────────────────────

router.put("/:id/toggle-status", async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "User not found" },
      });
      return;
    }

    // Prevent admin from demoting themselves
    if (String(user._id) === req.user!.userId) {
      res.status(400).json({
        success: false,
        error: { code: "SELF_MODIFY", message: "Cannot change your own role" },
      });
      return;
    }

    user.role = user.role === "ADMIN" ? "CUSTOMER" : "ADMIN";
    await user.save();

    res.json({
      success: true,
      data: user,
      message: `User role changed to ${user.role}`,
    });
  } catch (err) {
    logger.error(`Toggle user status error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to toggle user status" },
    });
  }
});

export default router;
