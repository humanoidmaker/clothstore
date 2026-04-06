import Razorpay from "razorpay";
import crypto from "crypto";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";

class RazorpayService {
  private instance: Razorpay;

  constructor() {
    this.instance = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET,
    });
  }

  /**
   * Create a Razorpay order.
   * @param amount — Amount in rupees (will be converted to paise).
   * @param currency — Currency code, defaults to INR.
   * @param receipt — A unique receipt identifier for this order.
   */
  async createOrder(
    amount: number,
    currency: string = "INR",
    receipt: string
  ): Promise<any> {
    try {
      const order = await this.instance.orders.create({
        amount: Math.round(amount * 100), // convert to paise
        currency,
        receipt,
      });
      logger.info(`Razorpay order created: ${order.id} for ₹${amount}`);
      return order;
    } catch (err) {
      logger.error(`Razorpay createOrder failed: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * Verify the payment signature returned by Razorpay Checkout.
   */
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      const body = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
        .createHmac("sha256", config.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(signature, "hex")
      );

      if (!isValid) {
        logger.warn(`Payment signature mismatch for order ${orderId}`);
      }
      return isValid;
    } catch (err) {
      logger.error(`Payment signature verification error: ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * Verify a Razorpay webhook signature.
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac("sha256", config.RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest("hex");

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(signature, "hex")
      );

      if (!isValid) {
        logger.warn("Webhook signature verification failed");
      }
      return isValid;
    } catch (err) {
      logger.error(`Webhook signature verification error: ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * Initiate a full or partial refund.
   * @param paymentId — The Razorpay payment ID to refund.
   * @param amount — Amount in rupees for partial refund. Omit for full refund.
   */
  async initiateRefund(paymentId: string, amount?: number): Promise<any> {
    try {
      const refundOptions: Record<string, any> = {};
      if (amount !== undefined) {
        refundOptions.amount = Math.round(amount * 100); // convert to paise
      }

      const refund = await this.instance.payments.refund(paymentId, refundOptions);
      logger.info(
        `Refund initiated for payment ${paymentId}${amount ? ` (partial: ₹${amount})` : " (full)"}: refund ${refund.id}`
      );
      return refund;
    } catch (err) {
      logger.error(`Razorpay refund failed for ${paymentId}: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * Fetch payment details from Razorpay.
   */
  async fetchPayment(paymentId: string): Promise<any> {
    try {
      const payment = await this.instance.payments.fetch(paymentId);
      logger.info(`Fetched payment details for ${paymentId}`);
      return payment;
    } catch (err) {
      logger.error(`Razorpay fetchPayment failed for ${paymentId}: ${(err as Error).message}`);
      throw err;
    }
  }
}

export const razorpayService = new RazorpayService();
