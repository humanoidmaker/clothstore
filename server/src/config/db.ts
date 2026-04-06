import mongoose from "mongoose";
import { config } from "./env.js";
import { logger } from "./logger.js";

export async function connectDB(): Promise<void> {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI);
    logger.info(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });
  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}
