import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { config } from "../config/env.js";
import { logger } from "../config/logger.js";
import type { ApiError } from "../types/index.js";

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number, code: string = "SERVER_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  logger.error(err);

  let statusCode = err.statusCode || 500;
  let response: ApiError = {
    success: false,
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: config.NODE_ENV === "production" ? "Something went wrong" : err.message,
    },
  };

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    const details = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    response = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details,
      },
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    response = {
      success: false,
      error: {
        code: "DUPLICATE_KEY",
        message: `A record with this ${field} already exists`,
      },
    };
  }

  // Mongoose cast error (invalid ObjectId, etc.)
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    response = {
      success: false,
      error: {
        code: "INVALID_ID",
        message: `Invalid ${err.path}: ${err.value}`,
      },
    };
  }

  // JWT errors
  if (err instanceof TokenExpiredError) {
    statusCode = 401;
    response = {
      success: false,
      error: {
        code: "TOKEN_EXPIRED",
        message: "Token has expired",
      },
    };
  }

  if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    response = {
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid token",
      },
    };
  }

  // AppError (custom)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    response = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };
  }

  if (config.NODE_ENV === "development" && err.stack) {
    (response.error as any).stack = err.stack;
  }

  res.status(statusCode).json(response);
}
