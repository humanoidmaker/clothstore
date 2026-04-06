import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { generalLimiter } from "../middleware/rateLimiter.js";
import { emailService } from "../services/email.js";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";

const router = Router();

// ── Validation schema ─────────────────────────────────────────────────

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(1, "Subject is required").trim(),
  message: z.string().min(1, "Message is required").trim(),
});

// ── POST / — Submit contact form ─────────────────────────────────────

router.post(
  "/",
  generalLimiter,
  validate(contactSchema),
  async (req: Request, res: Response) => {
    try {
      const { name, email, subject, message } = req.body;

      await emailService.sendContactFormNotification(config.SMTP_USER, {
        name,
        email,
        subject,
        message,
      });

      res.json({
        success: true,
        message: "Your message has been sent. We will get back to you soon.",
      });
    } catch (err) {
      logger.error(`Contact form error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to send message" },
      });
    }
  }
);

export default router;
