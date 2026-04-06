import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { razorpayService } from "../services/razorpay.js";
import { emailService } from "../services/email.js";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import User from "../models/User.js";

const router = Router();

// ── Validation schemas ────────────────────────────────────────────────

const createPaymentOrderSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
});

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

const refundSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  amount: z.number().positive().optional(),
});

// ── POST /create-order — Create Razorpay order ───────────────────────

router.post(
  "/create-order",
  authenticate,
  validate(createPaymentOrderSchema),
  async (req: Request, res: Response) => {
    try {
      const { orderId } = req.body;

      const order = await Order.findOne({
        _id: orderId,
        userId: req.user!.userId,
      });

      if (!order) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Order not found" },
        });
        return;
      }

      if (order.paymentStatus !== "PENDING") {
        res.status(400).json({
          success: false,
          error: {
            code: "PAYMENT_NOT_PENDING",
            message: `Payment status is ${order.paymentStatus}, cannot create payment order`,
          },
        });
        return;
      }

      const razorpayOrder = await razorpayService.createOrder(
        order.total,
        "INR",
        order.orderNumber
      );

      order.razorpayOrderId = razorpayOrder.id;
      await order.save();

      res.json({
        success: true,
        data: {
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: config.RAZORPAY_KEY_ID,
        },
        message: "Payment order created",
      });
    } catch (err) {
      logger.error(`Create payment order error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to create payment order" },
      });
    }
  }
);

// ── POST /verify — Verify Razorpay payment ───────────────────────────

router.post(
  "/verify",
  authenticate,
  validate(verifyPaymentSchema),
  async (req: Request, res: Response) => {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      const order = await Order.findOne({ razorpayOrderId });

      if (!order) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Order not found for this payment" },
        });
        return;
      }

      const isValid = razorpayService.verifyPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

      if (isValid) {
        order.paymentStatus = "PAID";
        order.razorpayPaymentId = razorpayPaymentId;
        order.razorpaySignature = razorpaySignature;
        order.status = "CONFIRMED";
        order.statusHistory.push({
          status: "CONFIRMED",
          timestamp: new Date(),
          note: "Payment verified successfully",
        });

        await order.save();

        // Send confirmation and receipt emails
        const user = await User.findById(order.userId).lean();
        if (user) {
          const items = await OrderItem.find({ orderId: order._id }).lean();
          emailService
            .sendOrderConfirmation(user.email, {
              ...order.toObject(),
              items,
            })
            .catch((e) => logger.error(`Order confirmation email failed: ${e}`));

          emailService
            .sendPaymentReceipt(user.email, {
              ...order.toObject(),
              paymentId: razorpayPaymentId,
            })
            .catch((e) => logger.error(`Payment receipt email failed: ${e}`));
        }

        res.json({
          success: true,
          data: { orderId: order._id, paymentStatus: order.paymentStatus },
          message: "Payment verified successfully",
        });
      } else {
        order.paymentStatus = "FAILED";
        await order.save();

        res.status(400).json({
          success: false,
          error: { code: "PAYMENT_FAILED", message: "Payment verification failed" },
        });
      }
    } catch (err) {
      logger.error(`Verify payment error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to verify payment" },
      });
    }
  }
);

// ── POST /webhook — Razorpay webhook (no auth) ──────────────────────

router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;

    if (!signature) {
      res.status(400).json({
        success: false,
        error: { code: "MISSING_SIGNATURE", message: "Webhook signature missing" },
      });
      return;
    }

    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      logger.warn("Invalid webhook signature received");
      res.status(400).json({
        success: false,
        error: { code: "INVALID_SIGNATURE", message: "Invalid webhook signature" },
      });
      return;
    }

    const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const eventType = event.event;

    logger.info(`Razorpay webhook received: ${eventType}`);

    switch (eventType) {
      case "payment.captured": {
        const razorpayOrderId = event.payload?.payment?.entity?.order_id;
        if (razorpayOrderId) {
          const order = await Order.findOne({ razorpayOrderId });
          if (order && order.paymentStatus !== "PAID") {
            order.paymentStatus = "PAID";
            order.razorpayPaymentId = event.payload.payment.entity.id;
            order.status = "CONFIRMED";
            order.statusHistory.push({
              status: "CONFIRMED",
              timestamp: new Date(),
              note: "Payment captured via webhook",
            });
            await order.save();
            logger.info(`Webhook: Order ${order.orderNumber} payment captured`);
          }
        }
        break;
      }

      case "payment.failed": {
        const razorpayOrderId = event.payload?.payment?.entity?.order_id;
        if (razorpayOrderId) {
          const order = await Order.findOne({ razorpayOrderId });
          if (order && order.paymentStatus === "PENDING") {
            order.paymentStatus = "FAILED";
            order.statusHistory.push({
              status: order.status,
              timestamp: new Date(),
              note: "Payment failed via webhook",
            });
            await order.save();
            logger.info(`Webhook: Order ${order.orderNumber} payment failed`);
          }
        }
        break;
      }

      case "refund.processed": {
        const razorpayOrderId = event.payload?.refund?.entity?.order_id;
        if (razorpayOrderId) {
          const order = await Order.findOne({ razorpayOrderId });
          if (order) {
            order.paymentStatus = "REFUNDED";
            order.status = "REFUNDED";
            order.statusHistory.push({
              status: "REFUNDED",
              timestamp: new Date(),
              note: "Refund processed via webhook",
            });
            await order.save();
            logger.info(`Webhook: Order ${order.orderNumber} refund processed`);
          }
        }
        break;
      }

      default:
        logger.info(`Unhandled webhook event: ${eventType}`);
    }

    // Always return 200 to acknowledge receipt
    res.json({ success: true, message: "Webhook processed" });
  } catch (err) {
    logger.error(`Webhook processing error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Webhook processing failed" },
    });
  }
});

// ── POST /refund — Admin initiate refund ─────────────────────────────

router.post(
  "/refund",
  authenticate,
  authorize("ADMIN"),
  validate(refundSchema),
  async (req: Request, res: Response) => {
    try {
      const { orderId, amount } = req.body;

      const order = await Order.findById(orderId);

      if (!order) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Order not found" },
        });
        return;
      }

      if (order.paymentStatus !== "PAID") {
        res.status(400).json({
          success: false,
          error: {
            code: "NOT_PAID",
            message: "Can only refund paid orders",
          },
        });
        return;
      }

      if (!order.razorpayPaymentId) {
        res.status(400).json({
          success: false,
          error: {
            code: "NO_PAYMENT_ID",
            message: "No payment ID found for this order",
          },
        });
        return;
      }

      const refund = await razorpayService.initiateRefund(
        order.razorpayPaymentId,
        amount
      );

      order.status = "REFUND_REQUESTED";
      order.statusHistory.push({
        status: "REFUND_REQUESTED",
        timestamp: new Date(),
        note: `Refund initiated by admin${amount ? ` for ₹${amount}` : " (full)"}. Refund ID: ${refund.id}`,
      });
      await order.save();

      res.json({
        success: true,
        data: { refundId: refund.id, orderId: order._id },
        message: "Refund initiated successfully",
      });
    } catch (err) {
      logger.error(`Refund error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to initiate refund" },
      });
    }
  }
);

export default router;
