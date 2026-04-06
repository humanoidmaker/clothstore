import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { config } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { logger, morganStream } from "./config/logger.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import addressRoutes from "./routes/address.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import newsletterRoutes from "./routes/newsletter.routes.js";

const app = express();

// Security & compression
app.use(helmet());
app.use(cors({ credentials: true, origin: config.CLIENT_URL }));
app.use(compression());

// Logging
app.use(morgan("combined", { stream: morganStream }));

// Body parsing
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
app.use(generalLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      uptime: process.uptime(),
    },
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
async function start() {
  await connectDB();
  app.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
  });
}

start().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});

export default app;
