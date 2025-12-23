import winston from "winston";
import { Request, Response, NextFunction } from "express";

import { config } from "@config/env";

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.app.env === "production" ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "devcycle-api" },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined logs
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Warning logs
    new winston.transports.File({
      filename: "logs/warn.log",
      level: "warn",
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
});

// Add console transport in non-production
if (config.app.env !== "production") {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Request logging middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  // Log request
  logger.info({
    type: "request",
    method,
    url: originalUrl,
    ip,
    userAgent: req.get("user-agent"),
  });

  // Log response
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      type: "response",
      method,
      url: originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip,
      userId: (req as any).user?.userId,
    };

    if (res.statusCode >= 500) {
      logger.error(logData);
    } else if (res.statusCode >= 400) {
      logger.warn(logData);
    } else {
      logger.info(logData);
    }
  });

  next();
};

// Error logging helper
export const logError = (error: Error, context?: Record<string, any>): void => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

// Info logging helper
export const logInfo = (message: string, meta?: Record<string, any>): void => {
  logger.info(message, meta);
};

// Warning logging helper
export const logWarning = (
  message: string,
  meta?: Record<string, any>
): void => {
  logger.warn(message, meta);
};

// Debug logging helper
export const logDebug = (message: string, meta?: Record<string, any>): void => {
  logger.debug(message, meta);
};

export default logger;
