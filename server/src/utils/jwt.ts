import jwt from "jsonwebtoken";
import { Response } from "express";
import { config } from "../config/env.js";
import type { AuthPayload } from "../types/index.js";

export function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRY as any,
  });
}

export function generateRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRY as any,
  });
}

export function verifyAccessToken(token: string): AuthPayload {
  const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as jwt.JwtPayload & AuthPayload;
  return { userId: decoded.userId, role: decoded.role };
}

export function verifyRefreshToken(token: string): AuthPayload {
  const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET) as jwt.JwtPayload & AuthPayload;
  return { userId: decoded.userId, role: decoded.role };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const isProduction = config.NODE_ENV === "production";

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/",
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
}
