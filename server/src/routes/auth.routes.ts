import { Router, Request, Response } from "express";
import { z } from "zod";
import User from "../models/User.js";
import Address from "../models/Address.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from "../utils/jwt.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateOTP } from "../utils/helpers.js";
import { emailService } from "../services/email.js";
import { logger } from "../config/logger.js";

const router = Router();

// ── Schemas ──────────────────────────────────────────────────────────

const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  phone: z.string().trim().optional().default(""),
});

const verifyEmailSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  phone: z.string().trim().optional(),
  avatar: z.string().trim().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// ── POST /register ───────────────────────────────────────────────────

router.post("/register", validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: "EMAIL_EXISTS", message: "An account with this email already exists" },
      });
      return;
    }

    const hashed = await hashPassword(password);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await User.create({
      firstName,
      lastName,
      email,
      password: hashed,
      phone,
      emailOTP: otp,
      emailOTPExpiry: otpExpiry,
    });

    await emailService.sendVerificationOTP(email, firstName, otp);

    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
    });
  } catch (err) {
    logger.error(`Register error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── POST /verify-email ──────────────────────────────────────────────

router.post("/verify-email", validate(verifyEmailSchema), async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select("+emailOTP +emailOTPExpiry");
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "No account found with this email" },
      });
      return;
    }

    if (!user.emailOTP || user.emailOTP !== otp) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_OTP", message: "Invalid verification code" },
      });
      return;
    }

    if (!user.emailOTPExpiry || user.emailOTPExpiry < new Date()) {
      res.status(400).json({
        success: false,
        error: { code: "OTP_EXPIRED", message: "Verification code has expired. Please request a new one." },
      });
      return;
    }

    user.emailVerified = true;
    user.emailOTP = undefined as any;
    user.emailOTPExpiry = undefined as any;
    await user.save();

    await emailService.sendWelcome(email, user.firstName);

    res.json({ success: true, message: "Email verified successfully." });
  } catch (err) {
    logger.error(`Verify-email error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── POST /login ─────────────────────────────────────────────────────

router.post("/login", authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password +refreshToken");
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
      });
      return;
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
      });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({
        success: false,
        error: {
          code: "EMAIL_NOT_VERIFIED",
          message: "Please verify your email before logging in.",
        },
      });
      return;
    }

    const payload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    const userObj = user.toJSON();
    delete (userObj as any).password;
    delete (userObj as any).refreshToken;

    res.json({
      success: true,
      data: { user: userObj },
      message: "Login successful.",
    });
  } catch (err) {
    logger.error(`Login error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── POST /refresh ───────────────────────────────────────────────────

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: "NO_TOKEN", message: "Refresh token not found" },
      });
      return;
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      clearAuthCookies(res);
      res.status(401).json({
        success: false,
        error: { code: "INVALID_TOKEN", message: "Invalid or expired refresh token" },
      });
      return;
    }

    const user = await User.findById(payload.userId).select("+refreshToken");
    if (!user || user.refreshToken !== token) {
      clearAuthCookies(res);
      res.status(401).json({
        success: false,
        error: { code: "INVALID_TOKEN", message: "Refresh token revoked" },
      });
      return;
    }

    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
    });

    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    res.json({ success: true, message: "Token refreshed." });
  } catch (err) {
    logger.error(`Refresh error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── POST /logout ────────────────────────────────────────────────────

router.post("/logout", async (req: Request, res: Response) => {
  try {
    clearAuthCookies(res);

    const token = req.cookies?.refresh_token;
    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        await User.findByIdAndUpdate(payload.userId, { $unset: { refreshToken: 1 } });
      } catch {
        // Token invalid — already effectively logged out
      }
    }

    res.json({ success: true, message: "Logged out successfully." });
  } catch (err) {
    logger.error(`Logout error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── POST /forgot-password ───────────────────────────────────────────

router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      // Always return success to avoid revealing whether the email exists
      const user = await User.findOne({ email });
      if (user) {
        const otp = generateOTP();
        user.resetOTP = otp;
        user.resetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await emailService.sendPasswordResetOTP(email, user.firstName, otp);
      }

      res.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset code.",
      });
    } catch (err) {
      logger.error(`Forgot-password error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      });
    }
  }
);

// ── POST /reset-password ────────────────────────────────────────────

router.post("/reset-password", validate(resetPasswordSchema), async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email }).select("+resetOTP +resetOTPExpiry +refreshToken");
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "No account found with this email" },
      });
      return;
    }

    if (!user.resetOTP || user.resetOTP !== otp) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_OTP", message: "Invalid reset code" },
      });
      return;
    }

    if (!user.resetOTPExpiry || user.resetOTPExpiry < new Date()) {
      res.status(400).json({
        success: false,
        error: { code: "OTP_EXPIRED", message: "Reset code has expired. Please request a new one." },
      });
      return;
    }

    user.password = await hashPassword(newPassword);
    user.resetOTP = undefined as any;
    user.resetOTPExpiry = undefined as any;
    user.refreshToken = undefined as any;
    await user.save();

    res.json({ success: true, message: "Password reset successful. Please log in with your new password." });
  } catch (err) {
    logger.error(`Reset-password error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── GET /me ─────────────────────────────────────────────────────────

router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      });
      return;
    }

    const addresses = await Address.find({ userId: user._id }).sort({ isDefault: -1, createdAt: -1 });

    const userObj = user.toJSON();
    (userObj as any).addresses = addresses;

    res.json({ success: true, data: { user: userObj } });
  } catch (err) {
    logger.error(`Get-me error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── PUT /me ─────────────────────────────────────────────────────────

router.put("/me", authenticate, validate(updateProfileSchema), async (req: Request, res: Response) => {
  try {
    const updates = req.body;

    const user = await User.findByIdAndUpdate(req.user!.userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      });
      return;
    }

    res.json({ success: true, data: { user }, message: "Profile updated." });
  } catch (err) {
    logger.error(`Update-me error: ${(err as Error).message}`);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
    });
  }
});

// ── PUT /me/password ────────────────────────────────────────────────

router.put(
  "/me/password",
  authenticate,
  validate(changePasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user!.userId).select("+password +refreshToken");
      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: "USER_NOT_FOUND", message: "User not found" },
        });
        return;
      }

      const match = await comparePassword(currentPassword, user.password);
      if (!match) {
        res.status(400).json({
          success: false,
          error: { code: "WRONG_PASSWORD", message: "Current password is incorrect" },
        });
        return;
      }

      user.password = await hashPassword(newPassword);
      user.refreshToken = undefined as any;
      await user.save();

      clearAuthCookies(res);

      res.json({
        success: true,
        message: "Password changed successfully. Please log in again.",
      });
    } catch (err) {
      logger.error(`Change-password error: ${(err as Error).message}`);
      res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      });
    }
  }
);

export default router;
