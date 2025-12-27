import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";

interface LogContext {
  requestId: string;
  method: string;
  url: string;
  path: string;
  query: any;
  params: any;
  ip: string;
  userAgent: string;
  userId?: string;
  workspaceId?: string;
  duration?: number;
  statusCode?: number;
  errorCode?: string;
  errorMessage?: string;
}

export class AdvancedRequestLogger {
  private static sensitiveFields = [
    "password",
    "token",
    "secret",
    "apiKey",
    "accessToken",
    "refreshToken",
    "creditCard",
    "ssn",
  ];

  /**
   * Sanitize sensitive data from objects
   */
  private static sanitize(obj: any): any {
    if (!obj || typeof obj !== "object") {
      return obj;
    }

    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();

      if (this.sensitiveFields.some((field) => lowerKey.includes(field))) {
        sanitized[key] = "***REDACTED***";
      } else if (typeof sanitized[key] === "object") {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Extract user info from request
   */
  private static extractUserInfo(req: any): {
    userId?: string;
    workspaceId?: string;
  } {
    return {
      userId: req.user?.userId,
      workspaceId: req.user?.workspaceId,
    };
  }

  /**
   * Build log context from request
   */
  private static buildContext(req: any): LogContext {
    const userInfo = this.extractUserInfo(req);

    return {
      requestId: req.id,
      method: req.method,
      url: req.url,
      path: req.path,
      query: this.sanitize(req.query),
      params: this.sanitize(req.params),
      ip: req.ip,
      userAgent: req.get("user-agent") || "unknown",
      ...userInfo,
    };
  }

  /**
   * Log request start
   */
  private static logRequestStart(req: any): void {
    const context = this.buildContext(req);

    logger.http("→ Incoming Request", {
      ...context,
      body: this.sanitize(req.body),
      headers: this.sanitize({
        authorization: req.headers.authorization ? "Bearer ***" : undefined,
        "content-type": req.headers["content-type"],
        accept: req.headers.accept,
      }),
    });
  }

  /**
   * Log request end
   */
  private static logRequestEnd(
    req: any,
    res: any,
    duration: number,
    responseBody?: any
  ): void {
    const context = this.buildContext(req);
    context.duration = duration;
    context.statusCode = res.statusCode;

    // Determine log level based on status code
    let logLevel: "http" | "warn" | "error" = "http";
    if (res.statusCode >= 500) {
      logLevel = "error";
    } else if (res.statusCode >= 400) {
      logLevel = "warn";
    }

    // Extract error info if present
    if (responseBody && !responseBody.success) {
      context.errorCode = responseBody.error?.code;
      context.errorMessage = responseBody.error?.message;
    }

    logger[logLevel]("← Outgoing Response", {
      ...context,
      responseSize: res.get("Content-Length"),
      responseTime: `${duration}ms`,
    });

    // Log slow requests
    if (duration > 1000) {
      logger.warn("⚠️  Slow Request Detected", {
        requestId: context.requestId,
        path: context.path,
        duration: `${duration}ms`,
        userId: context.userId,
      });
    }
  }

  /**
   * Main middleware
   */
  static middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Attach request ID
      (req as any).id = uuidv4();
      const startTime = Date.now();

      // Log request start
      this.logRequestStart(req);

      // Capture response
      let responseBody: any;
      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        responseBody = body;
        return originalJson(body);
      };

      // Log when response finishes
      res.on("finish", () => {
        const duration = Date.now() - startTime;
        AdvancedRequestLogger.logRequestEnd(req, res, duration, responseBody);
      });

      next();
    };
  }

  /**
   * Performance monitoring middleware
   */
  static performanceMonitor(
    thresholds: {
      slow?: number; // ms
      critical?: number; // ms
    } = {}
  ) {
    const slowThreshold = thresholds.slow || 1000;
    const criticalThreshold = thresholds.critical || 5000;

    return (req: any, res: Response, next: NextFunction): void => {
      const startTime = Date.now();

      res.on("finish", () => {
        const duration = Date.now() - startTime;

        if (duration > criticalThreshold) {
          logger.error("🚨 Critical Performance Issue", {
            requestId: req.id,
            path: req.path,
            method: req.method,
            duration: `${duration}ms`,
            threshold: `${criticalThreshold}ms`,
            userId: req.user?.userId,
          });
        } else if (duration > slowThreshold) {
          logger.warn("⏱️  Performance Warning", {
            requestId: req.id,
            path: req.path,
            method: req.method,
            duration: `${duration}ms`,
            threshold: `${slowThreshold}ms`,
          });
        }
      });

      next();
    };
  }

  /**
   * Error tracking middleware
   */
  static errorTracker() {
    return (err: Error, req: any, _res: Response, next: NextFunction): void => {
      const context = this.buildContext(req);

      logger.error("💥 Unhandled Error", {
        ...context,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
        body: this.sanitize(req.body),
      });

      next(err);
    };
  }

  /**
   * Request correlation middleware (for microservices)
   */
  static correlationId() {
    return (req: any, res: Response, next: NextFunction): void => {
      // Use existing correlation ID or create new one
      const correlationId =
        req.headers["x-correlation-id"] ||
        req.headers["x-request-id"] ||
        uuidv4();

      req.correlationId = correlationId;
      res.setHeader("X-Correlation-ID", correlationId);

      next();
    };
  }

  /**
   * User activity tracker
   */
  static activityTracker() {
    return (req: any, res: Response, next: NextFunction): void => {
      if (!req.user) {
        return next();
      }

      res.on("finish", () => {
        // Only track successful requests
        if (res.statusCode < 400) {
          logger.info("👤 User Activity", {
            userId: req.user.userId,
            action: `${req.method} ${req.path}`,
            requestId: req.id,
            timestamp: new Date().toISOString(),
          });
        }
      });

      next();
    };
  }

  /**
   * API metrics collector
   */
  static metricsCollector() {
    const metrics = new Map<
      string,
      {
        count: number;
        totalDuration: number;
        errors: number;
      }
    >();

    return (req: any, res: Response, next: NextFunction): void => {
      const startTime = Date.now();
      const endpoint = `${req.method} ${req.route?.path || req.path}`;

      res.on("finish", () => {
        const duration = Date.now() - startTime;

        if (!metrics.has(endpoint)) {
          metrics.set(endpoint, { count: 0, totalDuration: 0, errors: 0 });
        }

        const metric = metrics.get(endpoint)!;
        metric.count++;
        metric.totalDuration += duration;

        if (res.statusCode >= 400) {
          metric.errors++;
        }

        // Log metrics every 100 requests
        if (metric.count % 100 === 0) {
          logger.info("📊 API Metrics", {
            endpoint,
            requests: metric.count,
            avgDuration: Math.round(metric.totalDuration / metric.count),
            errors: metric.errors,
            errorRate: ((metric.errors / metric.count) * 100).toFixed(2) + "%",
          });
        }
      });

      next();
    };
  }
}
