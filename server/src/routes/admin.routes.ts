import { Router, Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateQuery } from "../middleware/validate.js";
import { logger } from "../config/logger.js";
import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import ProductVariant from "../models/ProductVariant.js";

const router = Router();
router.use(authenticate, authorize("ADMIN"));

// ── Validation schemas ────────────────────────────────────────────────

const statsQuerySchema = z.object({
  period: z.enum(["7d", "30d", "12m"]).default("7d"),
});

// ── GET /dashboard — Admin dashboard data ────────────────────────────

router.get("/dashboard", async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    // Run all queries in parallel
    const [
      totalRevenueResult,
      totalOrders,
      totalCustomers,
      totalProducts,
      recentOrders,
      lowStockAlerts,
      topSellingProducts,
      dailyRevenue,
      monthlyRevenue,
    ] = await Promise.all([
      // Total revenue from paid orders
      Order.aggregate([
        { $match: { paymentStatus: "PAID" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),

      // Total orders count
      Order.countDocuments(),

      // Total customers
      User.countDocuments({ role: "CUSTOMER" }),

      // Total active products
      Product.countDocuments({ isActive: true }),

      // Recent 10 orders
      Order.find()
        .populate("userId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Low stock alerts (variants with stock < 10)
      ProductVariant.find({ stock: { $lt: 10 } })
        .populate("productId", "name slug")
        .sort({ stock: 1 })
        .lean(),

      // Top selling products (aggregate from order items)
      OrderItem.aggregate([
        {
          $group: {
            _id: "$productName",
            totalQuantity: { $sum: "$quantity" },
            totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 },
        {
          $project: {
            productName: "$_id",
            totalQuantity: 1,
            totalRevenue: 1,
            _id: 0,
          },
        },
      ]),

      // Daily revenue (last 7 days)
      Order.aggregate([
        {
          $match: {
            paymentStatus: "PAID",
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" },
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: "$_id",
            revenue: 1,
            orders: 1,
            _id: 0,
          },
        },
      ]),

      // Monthly revenue (last 12 months)
      Order.aggregate([
        {
          $match: {
            paymentStatus: "PAID",
            createdAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "Asia/Kolkata" },
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: "$_id",
            revenue: 1,
            orders: 1,
            _id: 0,
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenueResult[0]?.total || 0,
        totalOrders,
        totalCustomers,
        totalProducts,
        recentOrders,
        lowStockAlerts,
        topSellingProducts,
        revenueChart: {
          daily: dailyRevenue,
          monthly: monthlyRevenue,
        },
      },
    });
  } catch (err) {
    logger.error(`Dashboard error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to fetch dashboard data" },
    });
  }
});

// ── GET /stats — Revenue and order stats by period ───────────────────

router.get(
  "/stats",
  validateQuery(statsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { period } = req.query as unknown as z.infer<typeof statsQuerySchema>;

      let dateFrom: Date;
      let groupFormat: string;
      const now = new Date();

      switch (period) {
        case "7d":
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          groupFormat = "%Y-%m-%d";
          break;
        case "30d":
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          groupFormat = "%Y-%m-%d";
          break;
        case "12m":
          dateFrom = new Date(now.getFullYear() - 1, now.getMonth(), 1);
          groupFormat = "%Y-%m";
          break;
      }

      const stats = await Order.aggregate([
        {
          $match: {
            paymentStatus: "PAID",
            createdAt: { $gte: dateFrom! },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: groupFormat!, date: "$createdAt", timezone: "Asia/Kolkata" },
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: "$_id",
            revenue: 1,
            orders: 1,
            _id: 0,
          },
        },
      ]);

      res.json({
        success: true,
        data: stats,
      });
    } catch (err) {
      logger.error(`Stats error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to fetch stats" },
      });
    }
  }
);

export default router;
