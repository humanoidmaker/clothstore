import { Router, Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate, validateQuery } from "../middleware/validate.js";
import { paginationHelper } from "../utils/helpers.js";
import { generateOrderNumber } from "../utils/orderNumber.js";
import { emailService } from "../services/email.js";
import { logger } from "../config/logger.js";
import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import CartItem from "../models/CartItem.js";
import ProductVariant from "../models/ProductVariant.js";
import Address from "../models/Address.js";
import Coupon from "../models/Coupon.js";

const router = Router();

// ── Validation schemas ────────────────────────────────────────────────

const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
});

const createOrderSchema = z.object({
  shippingAddressId: z.string().min(1, "Shipping address is required"),
  billingAddressId: z.string().optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUND_REQUESTED",
    "REFUNDED",
  ]),
  note: z.string().optional(),
});

// ── GET / — List orders ───────────────────────────────────────────────

router.get(
  "/",
  authenticate,
  validateQuery(listOrdersQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { page, limit, status, paymentStatus } = req.query as unknown as z.infer<typeof listOrdersQuerySchema>;
      const skip = (page - 1) * limit;

      const filter: Record<string, any> = {};
      if (req.user!.role !== "ADMIN") {
        filter.userId = req.user!.userId;
      }
      if (status) filter.status = status;
      if (paymentStatus) filter.paymentStatus = paymentStatus;

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .populate("userId", "firstName lastName email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Order.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: orders,
        pagination: paginationHelper(page, limit, total),
      });
    } catch (err) {
      logger.error(`List orders error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to fetch orders" },
      });
    }
  }
);

// ── GET /:id — Get single order ──────────────────────────────────────

router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "firstName lastName email")
      .lean();

    if (!order) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Order not found" },
      });
      return;
    }

    // Customers can only view their own orders
    const orderUserId = (order.userId as any)?._id || order.userId;
    if (req.user!.role !== "ADMIN" && String(orderUserId) !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied" },
      });
      return;
    }

    const items = await OrderItem.find({ orderId: order._id }).lean();

    res.json({
      success: true,
      data: { ...order, items },
    });
  } catch (err) {
    logger.error(`Get order error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to fetch order" },
    });
  }
});

// ── POST / — Create order from cart ──────────────────────────────────

router.post(
  "/",
  authenticate,
  validate(createOrderSchema),
  async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userId = req.user!.userId;
      const { shippingAddressId, billingAddressId, couponCode, notes } = req.body;

      // 1. Get cart items with populated variants and products
      const cartItems = await CartItem.find({ userId })
        .populate({
          path: "variantId",
          populate: { path: "productId" },
        })
        .session(session)
        .lean();

      if (!cartItems.length) {
        await session.abortTransaction();
        res.status(400).json({
          success: false,
          error: { code: "EMPTY_CART", message: "Your cart is empty" },
        });
        return;
      }

      // 2. Validate stock and calculate subtotal
      let subtotal = 0;
      const orderItemsData: any[] = [];

      for (const item of cartItems) {
        const variant = item.variantId as any;
        if (!variant || !variant.productId) {
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            error: { code: "INVALID_ITEM", message: "A product in your cart is no longer available" },
          });
          return;
        }

        const product = variant.productId;

        if (variant.stock < item.quantity) {
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            error: {
              code: "INSUFFICIENT_STOCK",
              message: `Insufficient stock for ${product.name} (${variant.size}/${variant.color}). Available: ${variant.stock}`,
            },
          });
          return;
        }

        const lineTotal = product.price * item.quantity;
        subtotal += lineTotal;

        orderItemsData.push({
          variantId: variant._id,
          productName: product.name,
          productSlug: product.slug,
          size: variant.size,
          color: variant.color,
          price: product.price,
          quantity: item.quantity,
          image: variant.images?.[0] || "",
        });
      }

      // 3. Validate coupon if provided
      let discount = 0;
      let appliedCouponCode = "";

      if (couponCode) {
        const coupon = await Coupon.findOne({
          code: couponCode.toUpperCase(),
          isActive: true,
        }).session(session);

        if (!coupon) {
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            error: { code: "INVALID_COUPON", message: "Coupon not found or inactive" },
          });
          return;
        }

        const now = new Date();
        if (now < coupon.validFrom || now > coupon.validUntil) {
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            error: { code: "COUPON_EXPIRED", message: "Coupon has expired or is not yet valid" },
          });
          return;
        }

        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            error: { code: "COUPON_LIMIT", message: "Coupon usage limit reached" },
          });
          return;
        }

        if (subtotal < coupon.minimumAmount) {
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            error: {
              code: "COUPON_MIN_AMOUNT",
              message: `Minimum order amount for this coupon is ₹${coupon.minimumAmount}`,
            },
          });
          return;
        }

        if (coupon.discountType === "PERCENTAGE") {
          discount = (coupon.discountValue * subtotal) / 100;
          if (coupon.maximumDiscount !== null) {
            discount = Math.min(discount, coupon.maximumDiscount);
          }
        } else {
          discount = coupon.discountValue;
        }

        discount = Math.min(discount, subtotal);
        appliedCouponCode = coupon.code;

        await Coupon.updateOne(
          { _id: coupon._id },
          { $inc: { usedCount: 1 } }
        ).session(session);
      }

      // 4. Calculate tax, shipping, total
      const tax = 0;
      const shippingCharge = subtotal >= 999 ? 0 : 99;
      const total = subtotal + tax + shippingCharge - discount;

      // 5. Get addresses
      const shippingAddress = await Address.findOne({ _id: shippingAddressId, userId })
        .session(session)
        .lean();

      if (!shippingAddress) {
        await session.abortTransaction();
        res.status(400).json({
          success: false,
          error: { code: "INVALID_ADDRESS", message: "Shipping address not found" },
        });
        return;
      }

      let billingAddressDoc = shippingAddress;
      if (billingAddressId && billingAddressId !== shippingAddressId) {
        const found = await Address.findOne({ _id: billingAddressId, userId })
          .session(session)
          .lean();
        if (!found) {
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            error: { code: "INVALID_ADDRESS", message: "Billing address not found" },
          });
          return;
        }
        billingAddressDoc = found;
      }

      const toAddressObj = (addr: any) => ({
        fullName: addr.fullName,
        phone: addr.phone,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 || "",
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        country: addr.country || "India",
      });

      // 6. Generate order number and create order
      const orderNumber = generateOrderNumber();

      const [order] = await Order.create(
        [
          {
            orderNumber,
            userId,
            status: "PENDING",
            paymentStatus: "PENDING",
            paymentMethod: "razorpay",
            subtotal,
            tax,
            shippingCharge,
            discount,
            total,
            shippingAddress: toAddressObj(shippingAddress),
            billingAddress: toAddressObj(billingAddressDoc),
            couponCode: appliedCouponCode,
            notes: notes || "",
            statusHistory: [{ status: "PENDING", timestamp: new Date(), note: "Order created" }],
          },
        ],
        { session }
      );

      // 7. Create order items
      const itemsToInsert = orderItemsData.map((item) => ({
        ...item,
        orderId: order._id,
      }));
      await OrderItem.insertMany(itemsToInsert, { session });

      // 8. Reduce stock for each variant
      for (const item of orderItemsData) {
        const result = await ProductVariant.updateOne(
          { _id: item.variantId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        ).session(session);

        if (result.modifiedCount === 0) {
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            error: {
              code: "INSUFFICIENT_STOCK",
              message: `Stock changed for ${item.productName}. Please try again.`,
            },
          });
          return;
        }
      }

      // 9. Clear user's cart
      await CartItem.deleteMany({ userId }).session(session);

      await session.commitTransaction();

      const populatedOrder = await Order.findById(order._id)
        .populate("userId", "firstName lastName email")
        .lean();
      const items = await OrderItem.find({ orderId: order._id }).lean();

      res.status(201).json({
        success: true,
        data: { ...populatedOrder, items },
        message: "Order created successfully",
      });
    } catch (err) {
      await session.abortTransaction();
      logger.error(`Create order error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to create order" },
      });
    } finally {
      session.endSession();
    }
  }
);

// ── PUT /:id/cancel — Customer cancel order ─────────────────────────

router.put("/:id/cancel", authenticate, async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Order not found" },
      });
      return;
    }

    if (req.user!.role !== "ADMIN" && String(order.userId) !== req.user!.userId) {
      await session.abortTransaction();
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied" },
      });
      return;
    }

    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        error: {
          code: "CANNOT_CANCEL",
          message: `Cannot cancel order with status ${order.status}`,
        },
      });
      return;
    }

    // Restore stock
    const items = await OrderItem.find({ orderId: order._id }).session(session);
    for (const item of items) {
      if (item.variantId) {
        await ProductVariant.updateOne(
          { _id: item.variantId },
          { $inc: { stock: item.quantity } }
        ).session(session);
      }
    }

    if (order.paymentStatus === "PAID") {
      order.status = "REFUND_REQUESTED";
      order.statusHistory.push({
        status: "REFUND_REQUESTED",
        timestamp: new Date(),
        note: "Order cancelled by customer, refund requested",
      });
    } else {
      order.status = "CANCELLED";
      order.statusHistory.push({
        status: "CANCELLED",
        timestamp: new Date(),
        note: "Order cancelled by customer",
      });
    }

    await order.save({ session });
    await session.commitTransaction();

    res.json({
      success: true,
      data: order,
      message: "Order cancelled successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    logger.error(`Cancel order error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Failed to cancel order" },
    });
  } finally {
    session.endSession();
  }
});

// ── PUT /:id/status — Admin update status ────────────────────────────

router.put(
  "/:id/status",
  authenticate,
  authorize("ADMIN"),
  validate(updateStatusSchema),
  async (req: Request, res: Response) => {
    try {
      const { status, note } = req.body;

      const order = await Order.findById(req.params.id).populate(
        "userId",
        "firstName lastName email"
      );

      if (!order) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Order not found" },
        });
        return;
      }

      order.status = status;
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        note: note || `Status updated to ${status} by admin`,
      });

      // If delivered and COD, mark as paid
      if (status === "DELIVERED") {
        order.paymentStatus = "PAID";
      }

      await order.save();

      // Send status update email
      const user = order.userId as any;
      if (user?.email) {
        emailService
          .sendOrderStatusUpdate(user.email, user.firstName, order.orderNumber, status)
          .catch((e) => logger.error(`Status email failed: ${e}`));
      }

      res.json({
        success: true,
        data: order,
        message: `Order status updated to ${status}`,
      });
    } catch (err) {
      logger.error(`Update order status error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to update order status" },
      });
    }
  }
);

export default router;
