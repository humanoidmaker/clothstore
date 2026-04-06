import dotenv from "dotenv";
dotenv.config();

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue?: number): number {
  const raw = process.env[key];
  if (raw !== undefined) {
    const parsed = Number(raw);
    if (isNaN(parsed)) {
      throw new Error(`Environment variable ${key} must be a number, got: ${raw}`);
    }
    return parsed;
  }
  if (defaultValue !== undefined) return defaultValue;
  throw new Error(`Missing required environment variable: ${key}`);
}

export const config = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: getEnvNumber("PORT", 5000),
  CLIENT_URL: getEnv("CLIENT_URL", "http://localhost:3000"),

  MONGODB_URI: getEnv("MONGODB_URI", "mongodb://localhost:27017/clothstore"),

  JWT_ACCESS_SECRET: getEnv("JWT_ACCESS_SECRET", "dev-access-secret-change-in-production"),
  JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET", "dev-refresh-secret-change-in-production"),
  JWT_ACCESS_EXPIRY: getEnv("JWT_ACCESS_EXPIRY", "15m"),
  JWT_REFRESH_EXPIRY: getEnv("JWT_REFRESH_EXPIRY", "7d"),

  RAZORPAY_KEY_ID: getEnv("RAZORPAY_KEY_ID", ""),
  RAZORPAY_KEY_SECRET: getEnv("RAZORPAY_KEY_SECRET", ""),
  RAZORPAY_WEBHOOK_SECRET: getEnv("RAZORPAY_WEBHOOK_SECRET", ""),

  SMTP_HOST: getEnv("SMTP_HOST", ""),
  SMTP_PORT: getEnvNumber("SMTP_PORT", 587),
  SMTP_USER: getEnv("SMTP_USER", ""),
  SMTP_PASS: getEnv("SMTP_PASS", ""),
  SMTP_FROM: getEnv("SMTP_FROM", "noreply@clothstore.com"),
} as const;

export type Config = typeof config;
