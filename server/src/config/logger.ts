import winston from "winston";
import { config } from "./env.js";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: combine(colorize(), timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), errors({ stack: true }), logFormat),
  }),
];

if (config.NODE_ENV === "production") {
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: combine(timestamp(), errors({ stack: true }), logFormat),
      maxsize: 5_242_880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      format: combine(timestamp(), errors({ stack: true }), logFormat),
      maxsize: 5_242_880,
      maxFiles: 5,
    })
  );
}

export const logger = winston.createLogger({
  level: config.NODE_ENV === "production" ? "info" : "debug",
  transports,
});

export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
