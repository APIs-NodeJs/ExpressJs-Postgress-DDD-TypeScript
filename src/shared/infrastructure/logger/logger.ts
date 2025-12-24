import winston from "winston";
import { env, isProduction } from "../../../config/env";

export interface ILogger {
  info(message: string, meta?: Record<string, any>): void;
  error(
    message: string,
    error?: Error | unknown,
    meta?: Record<string, any>
  ): void;
  warn(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
  request(meta: {
    requestId: string;
    method: string;
    url: string;
    userId?: string;
    ip?: string;
    duration?: number;
  }): void;
  security(event: string, meta?: Record<string, any>): void;
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  debug: "blue",
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const devFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    (info) =>
      `${info.timestamp} ${info.level}: ${info.message}${info.stack ? "\n" + info.stack : ""}`
  )
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isProduction ? format : devFormat,
  }),
];

// Add file transports in production
if (isProduction) {
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  levels,
  format,
  transports,
  exitOnError: false,
});

// Structured logging helpers
export class Logger {
  static info(message: string, meta?: Record<string, any>): void {
    logger.info(message, meta);
  }

  static error(
    message: string,
    error?: Error | unknown,
    meta?: Record<string, any>
  ): void {
    if (error instanceof Error) {
      logger.error(message, {
        ...meta,
        error: error.message,
        stack: error.stack,
      });
    } else {
      logger.error(message, { ...meta, error });
    }
  }

  static warn(message: string, meta?: Record<string, any>): void {
    logger.warn(message, meta);
  }

  static debug(message: string, meta?: Record<string, any>): void {
    logger.debug(message, meta);
  }

  /*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Logs an HTTP request
   * @param {Object} meta - Request metadata
   * @param {string} meta.requestId - Request ID
   * @param {string} meta.method - HTTP method
   * @param {string} meta.url - URL requested
   * @param {string} [meta.userId] - User ID of requester
   * @param {string} [meta.ip] - IP address of requester
   * @param {number} [meta.duration] - Request duration in milliseconds
   */
  /*******  de37a45a-250a-4e47-9418-1c239a495dc8  *******/
  static request(meta: {
    requestId: string;
    method: string;
    url: string;
    userId?: string;
    ip?: string;
    duration?: number;
  }): void {
    logger.info("HTTP Request", meta);
  }

  static security(event: string, meta?: Record<string, any>): void {
    logger.warn(`SECURITY: ${event}`, { ...meta, type: "security" });
  }
}
