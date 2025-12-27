import winston from "winston";
import { Request } from "express";

/**
 * Log context for structured logging
 */
interface LogContext {
  requestId?: string;
  userId?: string;
  workspaceId?: string;
  correlationId?: string;
  sessionId?: string;
  traceId?: string;
  [key: string]: any;
}

/**
 * Performance metrics
 */
interface PerformanceMetrics {
  duration: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu?: {
    user: number;
    system: number;
  };
}

/**
 * Security event types
 */
enum SecurityEventType {
  AUTHENTICATION_SUCCESS = "AUTHENTICATION_SUCCESS",
  AUTHENTICATION_FAILURE = "AUTHENTICATION_FAILURE",
  AUTHORIZATION_FAILURE = "AUTHORIZATION_FAILURE",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  DATA_ACCESS = "DATA_ACCESS",
  DATA_MODIFICATION = "DATA_MODIFICATION",
  PRIVILEGE_ESCALATION_ATTEMPT = "PRIVILEGE_ESCALATION_ATTEMPT",
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
    trace: 6,
  },
  colors: {
    fatal: "red bold",
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "blue",
    trace: "gray",
  },
};

/**
 * Enhanced Winston Logger
 */
class AdvancedLogger {
  private logger: winston.Logger;
  private context: LogContext = {};

  constructor() {
    winston.addColors(customLevels.colors);

    // Create formatters
    const jsonFormat = winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
      winston.format.errors({ stack: true }),
      winston.format.metadata({
        fillExcept: ["message", "level", "timestamp", "label"],
      }),
      winston.format.json()
    );

    const consoleFormat = winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
      winston.format.colorize({ all: true }),
      winston.format.printf(({ timestamp, level, message, metadata }) => {
        const metaStr = Object.keys(metadata || {}).length
          ? JSON.stringify(metadata, null, 2)
          : "";
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
      })
    );

    // Create transports
    const transports: winston.transport[] = [
      // Console output with colors
      new winston.transports.Console({
        format: consoleFormat,
        level: process.env.LOG_LEVEL || "info",
      }),

      // Error log file
      new winston.transports.File({
        filename: "logs/error.log",
        level: "error",
        format: jsonFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 10,
        tailable: true,
      }),

      // Combined log file
      new winston.transports.File({
        filename: "logs/combined.log",
        format: jsonFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 30,
        tailable: true,
      }),

      // Security log file
      new winston.transports.File({
        filename: "logs/security.log",
        level: "warn",
        format: jsonFormat,
        maxsize: 10485760, // 10MB
        maxFiles: 90, // Keep for 3 months
      }),

      // HTTP requests log
      new winston.transports.File({
        filename: "logs/http.log",
        level: "http",
        format: jsonFormat,
        maxsize: 10485760,
        maxFiles: 7,
      }),
    ];

    // Add daily rotation for production
    if (process.env.NODE_ENV === "production") {
      const DailyRotateFile = require("winston-daily-rotate-file");

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
    });
  }

  /**
   * Set global context for all logs
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
   * Create child logger with specific context
   */
  child(context: LogContext): AdvancedLogger {
    const child = new AdvancedLogger();
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
      hostname: process.env.HOSTNAME,
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

  trace(message: string, meta?: Record<string, any>): void {
    this.log("trace", message, meta);
  }

  /**
   * Log HTTP request with detailed information
   */
  logRequest(req: Request, meta?: Record<string, any>): void {
    const sanitizedHeaders = this.sanitizeHeaders(req.headers);
    const sanitizedBody = this.sanitizeData(req.body);

    this.http("HTTP Request", {
      requestId: (req as any).id,
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      query: this.sanitizeData(req.query),
      params: req.params,
      headers: sanitizedHeaders,
      body: sanitizedBody,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      userId: (req as any).user?.userId,
      ...meta,
    });
  }

  /**
   * Log HTTP response
   */
  logResponse(
    req: Request,
    statusCode: number,
    duration: number,
    meta?: Record<string, any>
  ): void {
    const level =
      statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "http";

    this.log(level, "HTTP Response", {
      requestId: (req as any).id,
      method: req.method,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
      userId: (req as any).user?.userId,
      ...meta,
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(
    operation: string,
    metrics: PerformanceMetrics,
    meta?: Record<string, any>
  ): void {
    const level = metrics.duration > 5000 ? "warn" : "debug";

    this.log(level, `Performance: ${operation}`, {
      operation,
      duration: `${metrics.duration}ms`,
      memory: {
        used: `${(metrics.memory.used / 1024 / 1024).toFixed(2)}MB`,
        total: `${(metrics.memory.total / 1024 / 1024).toFixed(2)}MB`,
        percentage: `${metrics.memory.percentage.toFixed(2)}%`,
      },
      cpu: metrics.cpu,
      ...meta,
    });
  }

  /**
   * Log security event
   */
  logSecurity(
    eventType: SecurityEventType,
    details: Record<string, any>,
    meta?: Record<string, any>
  ): void {
    const level =
      eventType === SecurityEventType.AUTHENTICATION_FAILURE ||
      eventType === SecurityEventType.AUTHORIZATION_FAILURE ||
      eventType === SecurityEventType.SUSPICIOUS_ACTIVITY
        ? "warn"
        : "info";

    this.log(level, `Security Event: ${eventType}`, {
      securityEvent: true,
      eventType,
      ...details,
      ...meta,
    });
  }

  /**
   * Log database query
   */
  logQuery(query: string, duration: number, meta?: Record<string, any>): void {
    const level = duration > 1000 ? "warn" : "debug";

    this.log(level, "Database Query", {
      query: query.substring(0, 500), // Truncate long queries
      duration: `${duration}ms`,
      slow: duration > 1000,
      ...meta,
    });
  }

  /**
   * Log business event
   */
  logBusinessEvent(
    eventName: string,
    data: Record<string, any>,
    meta?: Record<string, any>
  ): void {
    this.info(`Business Event: ${eventName}`, {
      businessEvent: true,
      eventName,
      data,
      ...meta,
    });
  }

  /**
   * Log error with stack trace and context
   */
  logError(
    error: Error,
    context?: Record<string, any>,
    meta?: Record<string, any>
  ): void {
    this.error(error.message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: (error as any).cause,
      },
      context,
      ...meta,
    });
  }

  /**
   * Sanitize sensitive data from headers
   */
  private sanitizeHeaders(headers: any): Record<string, any> {
    const sanitized = { ...headers };
    const sensitiveHeaders = [
      "authorization",
      "cookie",
      "x-api-key",
      "x-auth-token",
    ];

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = "***REDACTED***";
      }
    });

    return sanitized;
  }

  /**
   * Sanitize sensitive data from objects
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== "object") {
      return data;
    }

    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "apiKey",
      "accessToken",
      "refreshToken",
      "creditCard",
      "ssn",
      "pin",
    ];

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();

      if (sensitiveFields.some((field) => lowerKey.includes(field))) {
        sanitized[key] = "***REDACTED***";
      } else if (typeof sanitized[key] === "object") {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private startTime: number;
  private startCpu?: NodeJS.CpuUsage;

  constructor() {
    this.startTime = Date.now();
    this.startCpu = process.cpuUsage();
  }

  /**
   * Get elapsed time and resource usage
   */
  end(): PerformanceMetrics {
    const duration = Date.now() - this.startTime;
    const currentMemory = process.memoryUsage();
    const endCpu = process.cpuUsage(this.startCpu);

    return {
      duration,
      memory: {
        used: currentMemory.heapUsed,
        total: currentMemory.heapTotal,
        percentage: (currentMemory.heapUsed / currentMemory.heapTotal) * 100,
      },
      cpu: {
        user: endCpu.user / 1000, // Convert to ms
        system: endCpu.system / 1000,
      },
    };
  }

  /**
   * Log performance and return result
   */
  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const monitor = new PerformanceMonitor();

    try {
      const result = await fn();
      const metrics = monitor.end();
      logger.logPerformance(operation, metrics);
      return result;
    } catch (error) {
      const metrics = monitor.end();
      logger.logPerformance(operation, metrics, { error: true });
      throw error;
    }
  }
}

/**
 * Request context middleware
 */
export class RequestContext {
  private static contexts = new Map<string, LogContext>();

  /**
   * Set context for current request
   */
  static set(requestId: string, context: LogContext): void {
    this.contexts.set(requestId, context);
  }

  /**
   * Get context for current request
   */
  static get(requestId: string): LogContext | undefined {
    return this.contexts.get(requestId);
  }

  /**
   * Clear context for request
   */
  static clear(requestId: string): void {
    this.contexts.delete(requestId);
  }

  /**
   * Cleanup old contexts (run periodically)
   */
}

/**
 * Metrics collector for aggregation
 */
export class MetricsCollector {
  private static metrics = {
    requests: {
      total: 0,
      byStatus: {} as Record<number, number>,
      byMethod: {} as Record<string, number>,
      byPath: {} as Record<string, number>,
    },
    errors: {
      total: 0,
      byType: {} as Record<string, number>,
    },
    performance: {
      avgResponseTime: 0,
      slowRequests: 0, // > 1s
      totalDuration: 0,
    },
  };

  /**
   * Record request metric
   */
  static recordRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number
  ): void {
    this.metrics.requests.total++;
    this.metrics.requests.byStatus[statusCode] =
      (this.metrics.requests.byStatus[statusCode] || 0) + 1;
    this.metrics.requests.byMethod[method] =
      (this.metrics.requests.byMethod[method] || 0) + 1;
    this.metrics.requests.byPath[path] =
      (this.metrics.requests.byPath[path] || 0) + 1;

    this.metrics.performance.totalDuration += duration;
    this.metrics.performance.avgResponseTime =
      this.metrics.performance.totalDuration / this.metrics.requests.total;

    if (duration > 1000) {
      this.metrics.performance.slowRequests++;
    }
  }

  /**
   * Record error metric
   */
  static recordError(errorType: string): void {
    this.metrics.errors.total++;
    this.metrics.errors.byType[errorType] =
      (this.metrics.errors.byType[errorType] || 0) + 1;
  }

  /**
   * Get current metrics
   */
  static getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  static reset(): void {
    this.metrics = {
      requests: {
        total: 0,
        byStatus: {},
        byMethod: {},
        byPath: {},
      },
      errors: {
        total: 0,
        byType: {},
      },
      performance: {
        avgResponseTime: 0,
        slowRequests: 0,
        totalDuration: 0,
      },
    };
  }
}

// Export singleton instance
export const logger = new AdvancedLogger();
export { SecurityEventType };
