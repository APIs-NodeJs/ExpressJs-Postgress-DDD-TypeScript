import { Request, Response, NextFunction } from "express";
import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";

import { RedisClient } from "@infrastructure/cache/redis";
import { ApiResponse } from "@infrastructure/http/responses/ApiResponse";
import { logger } from "@infrastructure/logging/logger";

// ============================================================================
// ADVANCED RATE LIMITING
// ============================================================================

// IP-based rate limiter (for anonymous users)
const rateLimiterByIP = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 60, // Block for 60 seconds if exceeded
});

// User-based rate limiter (for authenticated users)
const rateLimiterByUser = new RateLimiterMemory({
  points: 200, // Authenticated users get more requests
  duration: 60,
  blockDuration: 60,
});

// Strict rate limiter for sensitive endpoints (login, signup, etc.)
const strictRateLimiter = new RateLimiterMemory({
  points: 5, // Only 5 attempts
  duration: 60 * 15, // Per 15 minutes
  blockDuration: 60 * 15, // Block for 15 minutes
});

/**
 * Advanced rate limiting middleware
 */
export const advancedRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const key = userId || req.ip || "unknown";
    const limiter = userId ? rateLimiterByUser : rateLimiterByIP;

    await limiter.consume(key);
    next();
  } catch (error: any) {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      userId: (req as any).user?.userId,
      path: req.path,
    });

    ApiResponse.error(
      res,
      "RATE_LIMIT_EXCEEDED",
      "Too many requests. Please try again later.",
      429
    );
  }
};

/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const key = `strict:${req.ip || "unknown"}`;
    await strictRateLimiter.consume(key);
    next();
  } catch (error: any) {
    logger.warn("Strict rate limit exceeded", {
      ip: req.ip,
      path: req.path,
    });

    const retryAfter = Math.ceil(error.msBeforeNext / 1000) || 900;

    res.setHeader("Retry-After", retryAfter.toString());
    ApiResponse.error(
      res,
      "RATE_LIMIT_EXCEEDED",
      "Too many attempts. Please try again later.",
      429
    );
  }
};

// ============================================================================
// SQL INJECTION PROTECTION
// ============================================================================

const SQL_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /(--|;|\/\*|\*\/|xp_|sp_)/gi,
  /(\bOR\b.*=.*|AND\b.*=.*)/gi,
];

const checkForSQLInjection = (value: any): boolean => {
  if (typeof value === "string") {
    return SQL_PATTERNS.some((pattern) => pattern.test(value));
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).some(checkForSQLInjection);
  }

  return false;
};

/**
 * SQL Injection protection middleware
 */
export const sqlInjectionProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const checkData = [req.body, req.query, req.params];

  const hasSQLInjection = checkData.some(checkForSQLInjection);

  if (hasSQLInjection) {
    logger.warn("Potential SQL injection detected", {
      ip: req.ip,
      path: req.path,
      body: req.body,
      query: req.query,
    });

    return ApiResponse.badRequest(res, "Invalid input detected");
  }

  next();
};

// ============================================================================
// XSS PROTECTION
// ============================================================================

const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onload, etc.
  /<embed[^>]*>/gi,
  /<object[^>]*>/gi,
];

const sanitizeString = (str: string): string => {
  let sanitized = str;
  XSS_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });
  return sanitized;
};

const sanitizeValue = (value: any): any => {
  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (typeof value === "object" && value !== null) {
    const sanitized: any = {};
    Object.keys(value).forEach((key) => {
      sanitized[key] = sanitizeValue(value[key]);
    });
    return sanitized;
  }

  return value;
};

/**
 * XSS protection middleware
 */
export const xssProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
};

// ============================================================================
// CSRF PROTECTION (for forms)
// ============================================================================

/**
 * Generate CSRF token
 */
export const generateCSRFToken = (): string => {
  return require("crypto").randomBytes(32).toString("hex");
};

/**
 * CSRF protection middleware
 */
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip for GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const token = req.headers["x-csrf-token"] || req.body._csrf;
  const sessionToken = (req as any).session?.csrfToken;

  if (!token || token !== sessionToken) {
    logger.warn("CSRF token mismatch", {
      ip: req.ip,
      path: req.path,
    });

    return ApiResponse.forbidden(res, "Invalid CSRF token");
  }

  next();
};

// ============================================================================
// IP WHITELIST/BLACKLIST
// ============================================================================

const BLACKLISTED_IPS: Set<string> = new Set([
  // Add blacklisted IPs here
]);

const WHITELISTED_IPS: Set<string> = new Set([
  // Add whitelisted IPs here
  "127.0.0.1",
  "::1",
]);

/**
 * IP filtering middleware
 */
export const ipFilter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const clientIP = req.ip || "unknown";

  // Check blacklist
  if (BLACKLISTED_IPS.has(clientIP)) {
    logger.warn("Blocked request from blacklisted IP", { ip: clientIP });
    return ApiResponse.forbidden(res, "Access denied");
  }

  // For admin routes, you might want to check whitelist
  // Uncomment if needed:
  // if (!WHITELISTED_IPS.has(clientIP)) {
  //   return ApiResponse.forbidden(res, "Access denied");
  // }

  next();
};

// ============================================================================
// REQUEST SIZE LIMITER
// ============================================================================

/**
 * Limit request body size
 */
export const bodySizeLimiter = (maxSizeInMB: number = 10) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers["content-length"] || "0");
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (contentLength > maxSizeInBytes) {
      logger.warn("Request body too large", {
        ip: req.ip,
        size: contentLength,
        maxSize: maxSizeInBytes,
      });

      return ApiResponse.error(
        res,
        "PAYLOAD_TOO_LARGE",
        "Request body is too large",
        413
      );
    }

    next();
  };
};
