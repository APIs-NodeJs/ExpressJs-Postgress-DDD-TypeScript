import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";

/**
 * Sensitive fields to redact from logs
 */
const SENSITIVE_FIELDS = [
  "password",
  "token",
  "secret",
  "apiKey",
  "accessToken",
  "refreshToken",
  "creditCard",
  "ssn",
  "authorization",
];

/**
 * Sanitize object by redacting sensitive fields
 */
function sanitize(obj: any): any {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();

    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      sanitized[key] = "***REDACTED***";
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitize(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Main request logging middleware
 */
export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Attach unique request ID
    (req as any).id = req.headers["x-request-id"] || uuidv4();
    const startTime = Date.now();

    // Log incoming request
    logger.http("→ Incoming Request", {
      requestId: (req as any).id,
      method: req.method,
      url: req.url,
      path: req.path,
      query: sanitize(req.query),
      ip: req.ip,
      userAgent: req.get("user-agent"),
      userId: (req as any).user?.userId,
    });

    // Capture response body
    let responseBody: any;
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      responseBody = body;
      return originalJson(body);
    };

    // Log response when finished
    res.on("finish", () => {
      const duration = Date.now() - startTime;
      const logLevel =
        res.statusCode >= 500
          ? "error"
          : res.statusCode >= 400
            ? "warn"
            : "http";

      logger[logLevel]("← Outgoing Response", {
        requestId: (req as any).id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: (req as any).user?.userId,
        errorCode: responseBody?.error?.code,
      });

      // Warn on slow requests
      if (duration > 1000) {
        logger.warn("⚠️  Slow Request", {
          requestId: (req as any).id,
          path: req.path,
          duration: `${duration}ms`,
        });
      }
    });

    next();
  };
}

/**
 * Correlation ID middleware for distributed tracing
 */
export function correlationId() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const correlationId =
      req.headers["x-correlation-id"] ||
      req.headers["x-request-id"] ||
      uuidv4();

    (req as any).correlationId = correlationId;
    res.setHeader("X-Correlation-ID", correlationId);
    next();
  };
}

/**
 * Performance monitoring middleware
 */
export function performanceMonitor(
  options: {
    slow?: number;
    critical?: number;
  } = {}
) {
  const slowThreshold = options.slow || 1000;
  const criticalThreshold = options.critical || 5000;

  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - startTime;

      if (duration > criticalThreshold) {
        logger.error("🚨 Critical Performance Issue", {
          requestId: (req as any).id,
          path: req.path,
          method: req.method,
          duration: `${duration}ms`,
          threshold: `${criticalThreshold}ms`,
        });
      } else if (duration > slowThreshold) {
        logger.warn("⏱️  Performance Warning", {
          requestId: (req as any).id,
          path: req.path,
          duration: `${duration}ms`,
        });
      }
    });

    next();
  };
}

/**
 * User activity tracker
 */
export function activityTracker() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!(req as any).user) {
      return next();
    }

    res.on("finish", () => {
      if (res.statusCode < 400) {
        logger.info("👤 User Activity", {
          userId: (req as any).user.userId,
          action: `${req.method} ${req.path}`,
          requestId: (req as any).id,
        });
      }
    });

    next();
  };
}

/**
 * Error tracking middleware
 */
export function errorTracker() {
  return (
    err: Error,
    req: Request,
    _res: Response,
    next: NextFunction
  ): void => {
    logger.error("💥 Request Error", {
      requestId: (req as any).id,
      error: {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      path: req.path,
      method: req.method,
    });

    next(err);
  };
}
