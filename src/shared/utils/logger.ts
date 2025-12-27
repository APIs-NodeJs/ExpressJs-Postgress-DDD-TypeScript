import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

/**
 * Log context for structured logging
 */
interface LogContext {
  requestId?: string;
  userId?: string;
  workspaceId?: string;
  correlationId?: string;
  [key: string]: any;
}

/**
 * Custom log levels with priorities
 */
const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    http: 4,
    debug: 5,
  },
  colors: {
    fatal: "red bold",
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "blue",
  },
};

winston.addColors(customLevels.colors);

/**
 * Enhanced Winston Logger
 */
class Logger {
  private logger: winston.Logger;
  private context: LogContext = {};

  constructor() {
    // JSON format for file logging
    const jsonFormat = winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
      winston.format.errors({ stack: true }),
      winston.format.metadata({
        fillExcept: ["message", "level", "timestamp"],
      }),
      winston.format.json()
    );

    // Console format with colors
    const consoleFormat = winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
      winston.format.colorize({ all: true }),
      winston.format.printf(({ timestamp, level, message, metadata }) => {
        const metaStr =
          metadata && Object.keys(metadata).length
            ? `\n${JSON.stringify(metadata, null, 2)}`
            : "";
        return `${timestamp} [${level}]: ${message}${metaStr}`;
      })
    );

    // Create transports
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: consoleFormat,
        level: process.env.LOG_LEVEL || "info",
      }),
    ];

    // File transports for production
    if (process.env.NODE_ENV !== "test") {
      transports.push(
        // Error log
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
          format: jsonFormat,
          maxsize: 10485760, // 10MB
          maxFiles: 10,
        }),
        // Combined log
        new winston.transports.File({
          filename: "logs/combined.log",
          format: jsonFormat,
          maxsize: 10485760,
          maxFiles: 30,
        })
      );

      // Daily rotation for production
      if (process.env.NODE_ENV === "production") {
        transports.push(
          new DailyRotateFile({
            filename: "logs/application-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: "20m",
            maxFiles: "30d",
            format: jsonFormat,
          })
        );
      }
    }

    this.logger = winston.createLogger({
      levels: customLevels.levels,
      transports,
      exceptionHandlers: [
        new winston.transports.File({
          filename: "logs/exceptions.log",
          format: jsonFormat,
        }),
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: "logs/rejections.log",
          format: jsonFormat,
        }),
      ],
      silent: process.env.NODE_ENV === "test",
    });
  }

  /**
   * Set global context
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear global context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Create child logger with context
   */
  child(context: LogContext): Logger {
    const child = new Logger();
    child.setContext({ ...this.context, ...context });
    return child;
  }

  /**
   * Log with merged context
   */
  private log(
    level: string,
    message: string,
    meta?: Record<string, any>
  ): void {
    this.logger.log(level, message, {
      ...this.context,
      ...meta,
      environment: process.env.NODE_ENV,
      pid: process.pid,
    });
  }

  // Standard log methods
  fatal(message: string, meta?: Record<string, any>): void {
    this.log("fatal", message, meta);
  }

  error(message: string, meta?: Record<string, any>): void {
    this.log("error", message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log("warn", message, meta);
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log("info", message, meta);
  }

  http(message: string, meta?: Record<string, any>): void {
    this.log("http", message, meta);
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.log("debug", message, meta);
  }

  /**
   * Log error with full context
   */
  logError(error: Error, context?: Record<string, any>): void {
    this.error(error.message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export performance monitor utility
export class PerformanceMonitor {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  end(): number {
    return Date.now() - this.startTime;
  }

  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const monitor = new PerformanceMonitor();
    try {
      const result = await fn();
      const duration = monitor.end();
      logger.debug(`Performance: ${operation}`, { duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = monitor.end();
      logger.error(`Performance (with error): ${operation}`, {
        duration: `${duration}ms`,
      });
      throw error;
    }
  }
}
