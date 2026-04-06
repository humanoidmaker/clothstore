import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { logger } from "../config/logger.js";
import Newsletter from "../models/Newsletter.js";

const router = Router();

// ── Validation schema ─────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email("Valid email is required"),
});

// ── POST /subscribe — Subscribe to newsletter ────────────────────────

router.post(
  "/subscribe",
  validate(emailSchema),
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      await Newsletter.findOneAndUpdate(
        { email: email.toLowerCase() },
        { email: email.toLowerCase(), isActive: true },
        { upsert: true, new: true }
      );

      res.json({
        success: true,
        message: "Successfully subscribed to newsletter",
      });
    } catch (err) {
      logger.error(`Newsletter subscribe error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to subscribe" },
      });
    }
  }
);

// ── POST /unsubscribe — Unsubscribe from newsletter ──────────────────

router.post(
  "/unsubscribe",
  validate(emailSchema),
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      const result = await Newsletter.findOneAndUpdate(
        { email: email.toLowerCase() },
        { isActive: false },
        { new: true }
      );

      if (!result) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Email not found in subscriber list" },
        });
        return;
      }

      res.json({
        success: true,
        message: "Successfully unsubscribed from newsletter",
      });
    } catch (err) {
      logger.error(`Newsletter unsubscribe error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to unsubscribe" },
      });
    }
  }
);

export default router;
