import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  logger,
  PerformanceMonitor,
  MetricsCollector,
} from "../utils/AdvancedLogger";
import { ResponseHandler } from "../responses/ResponseHandler";
import { cacheService } from "../infrastructure/cache/CacheService";

/**
 * Request ID middleware with correlation support
 */
export class RequestIdMiddleware {
  static attach() {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Use existing correlation ID or create new one
      const correlationId =
        req.headers["x-correlation-id"] ||
        req.headers["x-request-id"] ||
        uuidv4();

      const requestId = uuidv4();

      (req as any).id = requestId;
      (req as any).correlationId = correlationId;

      // Set response headers
      res.setHeader("X-Request-ID", requestId);
      res.setHeader("X-Correlation-ID", correlationId as string);

      next();
    };
  }
}

/**
 * Comprehensive request/response logging
 */
export class RequestLoggingMiddleware {
  static log() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const startTime = Date.now();
      const monitor = new PerformanceMonitor();

      // Log incoming request
      logger.logRequest(req);

      // Capture response
      const originalJson = res.json.bind(res);
      let responseBody: any;

      res.json = function (body: any) {
        responseBody = body;
        return originalJson(body);
      };

      // Log when response finishes
      res.on("finish", () => {
        const duration = Date.now() - startTime;
        const metrics = monitor.end();

        logger.logResponse(req, res.statusCode, duration, {
          responseBody:
            process.env.NODE_ENV === "development" ? responseBody : undefined,
          metrics,
        });

        // Record metrics
        MetricsCollector.recordRequest(
          req.method,
          req.path,
          res.statusCode,
          duration
        );
      });

      next();
    };
  }
}

/**
 * Advanced rate limiting with multiple strategies
 */
export class AdvancedRateLimiter {
  /**
   * IP-based rate limiting
   */
  static byIP(options: {
    windowMs: number;
    maxRequests: number;
    message?: string;
  }) {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const requestId = (req as any).id;
      const ip = req.ip;
      const key = `rate_limit:ip:${ip}`;

      try {
        const current = await cacheService.get<number>(key);
        const count = (current || 0) + 1;

        if (count > options.maxRequests) {
          logger.warn("Rate limit exceeded (IP)", {
            ip,
            count,
            limit: options.maxRequests,
            requestId,
          });

          return ResponseHandler.rateLimitExceeded(
            res,
            options.message || "Too many requests from this IP",
            Math.ceil(options.windowMs / 1000),
            requestId
          );
        }

        await cacheService.setWithExpiry(
          key,
          count,
          Math.ceil(options.windowMs / 1000)
        );

        // Set rate limit headers
        res.setHeader("X-RateLimit-Limit", options.maxRequests.toString());
        res.setHeader(
          "X-RateLimit-Remaining",
          (options.maxRequests - count).toString()
        );
        res.setHeader(
          "X-RateLimit-Reset",
          new Date(Date.now() + options.windowMs).toISOString()
        );

        next();
      } catch (error) {
        logger.error("Rate limiter error", {
          error: error instanceof Error ? error.message : "Unknown error",
          requestId,
        });
        next(); // Continue on rate limiter error
      }
    };
  }

  /**
   * User-based rate limiting (requires authentication)
   */
  static byUser(options: {
    windowMs: number;
    maxRequests: number;
    message?: string;
  }) {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const requestId = (req as any).id;
      const userId = (req as any).user?.userId;

      if (!userId) {
        return next(); // Skip if not authenticated
      }

      const key = `rate_limit:user:${userId}`;

      try {
        const current = await cacheService.get<number>(key);
        const count = (current || 0) + 1;

        if (count > options.maxRequests) {
          logger.warn("Rate limit exceeded (User)", {
            userId,
            count,
            limit: options.maxRequests,
            requestId,
          });

          return ResponseHandler.rateLimitExceeded(
            res,
            options.message || "Too many requests",
            Math.ceil(options.windowMs / 1000),
            requestId
          );
        }

        await cacheService.setWithExpiry(
          key,
          count,
          Math.ceil(options.windowMs / 1000)
        );

        res.setHeader("X-RateLimit-Limit", options.maxRequests.toString());
        res.setHeader(
          "X-RateLimit-Remaining",
          (options.maxRequests - count).toString()
        );

        next();
      } catch (error) {
        logger.error("User rate limiter error", {
          error: error instanceof Error ? error.message : "Unknown error",
          userId,
          requestId,
        });
        next();
      }
    };
  }

  /**
   * Endpoint-specific rate limiting
   */
  static byEndpoint(
    endpoint: string,
    options: {
      windowMs: number;
      maxRequests: number;
      message?: string;
    }
  ) {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const requestId = (req as any).id;
      const identifier = (req as any).user?.userId || req.ip;
      const key = `rate_limit:endpoint:${endpoint}:${identifier}`;

      try {
        const current = await cacheService.get<number>(key);
        const count = (current || 0) + 1;

        if (count > options.maxRequests) {
          logger.warn("Rate limit exceeded (Endpoint)", {
            endpoint,
            identifier,
            count,
            limit: options.maxRequests,
            requestId,
          });

          return ResponseHandler.rateLimitExceeded(
            res,
            options.message || `Too many requests to ${endpoint}`,
            Math.ceil(options.windowMs / 1000),
            requestId
          );
        }

        await cacheService.setWithExpiry(
          key,
          count,
          Math.ceil(options.windowMs / 1000)
        );

        next();
      } catch (error) {
        logger.error("Endpoint rate limiter error", {
          error: error instanceof Error ? error.message : "Unknown error",
          endpoint,
          requestId,
        });
        next();
      }
    };
  }
}

/**
 * Request timeout middleware
 */
export class TimeoutMiddleware {
  static timeout(ms: number) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const requestId = (req as any).id;

      const timeoutId = setTimeout(() => {
        if (!res.headersSent) {
          logger.warn("Request timeout", {
            path: req.path,
            method: req.method,
            timeout: ms,
            requestId,
          });

          ResponseHandler.error(
            res,
            408,
            "REQUEST_TIMEOUT",
            `Request timeout after ${ms}ms`,
            undefined,
            requestId
          );
        }
      }, ms);

      // Clear timeout when response is sent
      res.on("finish", () => {
        clearTimeout(timeoutId);
      });

      next();
    };
  }
}

/**
 * Request size limiter
 */
export class RequestSizeMiddleware {
  static limit(maxSizeBytes: number) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const requestId = (req as any).id;
      const contentLength = parseInt(req.headers["content-length"] || "0", 10);

      if (contentLength > maxSizeBytes) {
        logger.warn("Request size exceeded", {
          size: contentLength,
          limit: maxSizeBytes,
          path: req.path,
          requestId,
        });

        return ResponseHandler.error(
          res,
          413,
          "PAYLOAD_TOO_LARGE",
          `Request size ${contentLength} bytes exceeds limit of ${maxSizeBytes} bytes`,
          undefined,
          requestId
        );
      }

      next();
    };
  }
}

/**
 * Content type validation
 */
export class ContentTypeMiddleware {
  static require(allowedTypes: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const requestId = (req as any).id;

      // Skip for GET, HEAD, DELETE
      if (["GET", "HEAD", "DELETE"].includes(req.method)) {
        return next();
      }

      const contentType = req.headers["content-type"]?.split(";")[0];

      if (!contentType || !allowedTypes.includes(contentType)) {
        logger.warn("Invalid content type", {
          contentType,
          allowed: allowedTypes,
          path: req.path,
          requestId,
        });

        return ResponseHandler.error(
          res,
          415,
          "UNSUPPORTED_MEDIA_TYPE",
          `Content-Type must be one of: ${allowedTypes.join(", ")}`,
          undefined,
          requestId
        );
      }

      next();
    };
  }
}

/**
 * Method validation
 */
export class MethodMiddleware {
  static allow(allowedMethods: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const requestId = (req as any).id;

      if (!allowedMethods.includes(req.method)) {
        logger.warn("Method not allowed", {
          method: req.method,
          allowed: allowedMethods,
          path: req.path,
          requestId,
        });

        res.setHeader("Allow", allowedMethods.join(", "));

        return ResponseHandler.error(
          res,
          405,
          "METHOD_NOT_ALLOWED",
          `Method ${req.method} is not allowed. Allowed methods: ${allowedMethods.join(", ")}`,
          undefined,
          requestId
        );
      }

      next();
    };
  }
}

/**
 * Response compression based on content
 */
export class CompressionMiddleware {
  static adaptive() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const originalJson = res.json.bind(res);

      res.json = function (body: any) {
        const acceptEncoding = req.headers["accept-encoding"] || "";
        const bodySize = JSON.stringify(body).length;

        // Only compress if body is larger than 1KB
        if (bodySize > 1024) {
          if (acceptEncoding.includes("gzip")) {
            res.setHeader("Content-Encoding", "gzip");
          } else if (acceptEncoding.includes("deflate")) {
            res.setHeader("Content-Encoding", "deflate");
          }
        }

        return originalJson(body);
      };

      next();
    };
  }
}

/**
 * API deprecation warning
 */
export class DeprecationMiddleware {
  static warn(options: {
    version: string;
    sunsetDate: Date;
    alternativeUrl?: string;
    message?: string;
  }) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const requestId = (req as any).id;

      // Set deprecation headers
      res.setHeader("Deprecation", "true");
      res.setHeader("Sunset", options.sunsetDate.toUTCString());

      if (options.alternativeUrl) {
        res.setHeader("Link", `<${options.alternativeUrl}>; rel="alternate"`);
      }

      const defaultMessage = `API version ${options.version} is deprecated and will be removed on ${options.sunsetDate.toDateString()}`;

      res.setHeader("Warning", `299 - "${options.message || defaultMessage}"`);

      logger.warn("Deprecated API accessed", {
        version: options.version,
        sunsetDate: options.sunsetDate,
        path: req.path,
        requestId,
      });

      next();
    };
  }
}

/**
 * Request caching middleware
 */
export class CachingMiddleware {
  static cache(options: {
    ttl: number;
    keyGenerator?: (req: Request) => string;
    shouldCache?: (req: Request) => boolean;
  }) {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const requestId = (req as any).id;

      // Only cache GET requests by default
      if (req.method !== "GET") {
        return next();
      }

      // Check if should cache
      if (options.shouldCache && !options.shouldCache(req)) {
        return next();
      }

      // Generate cache key
      const cacheKey =
        options.keyGenerator?.(req) ||
        `http_cache:${req.method}:${req.path}:${JSON.stringify(req.query)}`;

      try {
        // Try to get from cache
        const cached = await cacheService.get(cacheKey);

        if (cached) {
          logger.debug("Cache hit", { cacheKey, requestId });
          res.setHeader("X-Cache", "HIT");
          return res.json(cached);
        }

        // Cache miss - capture response
        const originalJson = res.json.bind(res);

        res.json = function (body: any) {
          // Cache successful responses
          if (res.statusCode >= 200 && res.statusCode < 300) {
            cacheService
              .setWithExpiry(cacheKey, body, options.ttl)
              .catch((err) => {
                logger.error("Failed to cache response", {
                  error: err.message,
                  cacheKey,
                  requestId,
                });
              });
          }

          res.setHeader("X-Cache", "MISS");
          return originalJson(body);
        };

        next();
      } catch (error) {
        logger.error("Caching middleware error", {
          error: error instanceof Error ? error.message : "Unknown error",
          cacheKey,
          requestId,
        });
        next();
      }
    };
  }

  /**
   * Cache invalidation middleware
   */
  static invalidate(pattern: string) {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      const requestId = (req as any).id;

      // Invalidate on write operations
      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        try {
          await cacheService.invalidatePattern(pattern);
          logger.debug("Cache invalidated", { pattern, requestId });
        } catch (error) {
          logger.error("Cache invalidation error", {
            error: error instanceof Error ? error.message : "Unknown error",
            pattern,
            requestId,
          });
        }
      }

      next();
    };
  }
}

/**
 * Maintenance mode middleware
 */
export class MaintenanceMiddleware {
  private static maintenanceMode = false;
  private static allowedIPs: string[] = [];

  static enable(allowedIPs: string[] = []): void {
    this.maintenanceMode = true;
    this.allowedIPs = allowedIPs;
    logger.warn("Maintenance mode enabled", { allowedIPs });
  }

  static disable(): void {
    this.maintenanceMode = false;
    this.allowedIPs = [];
    logger.info("Maintenance mode disabled");
  }

  static check() {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!MaintenanceMiddleware.maintenanceMode) {
        return next();
      }

      // Allow specific IPs
      if (MaintenanceMiddleware.allowedIPs.includes(req.ip)) {
        return next();
      }

      const requestId = (req as any).id;

      logger.warn("Request blocked - maintenance mode", {
        ip: req.ip,
        path: req.path,
        requestId,
      });

      return ResponseHandler.error(
        res,
        503,
        "MAINTENANCE_MODE",
        "Service is currently under maintenance. Please try again later.",
        {
          retryAfter: "1 hour",
        },
        requestId
      );
    };
  }
}

/**
 * Health check bypass middleware
 */
export class HealthCheckMiddleware {
  static bypass(healthPaths: string[] = ["/health", "/ready", "/live"]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (healthPaths.includes(req.path)) {
        // Skip authentication and other middleware for health checks
        (req as any).isHealthCheck = true;
      }
      next();
    };
  }
}

/**
 * Request sanitization middleware
 */
export class SanitizationMiddleware {
  static sanitize() {
    return (req: Request, _res: Response, next: NextFunction): void => {
      // Sanitize query parameters
      if (req.query) {
        req.query = this.sanitizeObject(req.query);
      }

      // Sanitize body
      if (req.body) {
        req.body = this.sanitizeObject(req.body);
      }

      // Sanitize params
      if (req.params) {
        req.params = this.sanitizeObject(req.params);
      }

      next();
    };
  }

  private static sanitizeObject(obj: any): any {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    const sanitized: any = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      const value = obj[key];

      if (typeof value === "string") {
        // Remove potentially dangerous characters
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .trim();
      } else if (typeof value === "object") {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

// Export all middleware
export {
  RequestIdMiddleware,
  RequestLoggingMiddleware,
  AdvancedRateLimiter,
  TimeoutMiddleware,
  RequestSizeMiddleware,
  ContentTypeMiddleware,
  MethodMiddleware,
  CompressionMiddleware,
  DeprecationMiddleware,
  CachingMiddleware,
  MaintenanceMiddleware,
  HealthCheckMiddleware,
  SanitizationMiddleware,
};
