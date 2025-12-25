import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { Request, Response } from "express";
import { APP_CONFIG } from "../../../config/app.config";
import { LoggingPatterns } from "../../../shared/infrastructure/logger/LoggingPatterns";
import { ERROR_CODES } from "../../../shared/domain/ErrorCodes";

interface RateLimiterConfig {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

/**
 * Create a rate limiter with standardized configuration
 */
const createRateLimiter = (
  config: RateLimiterConfig
): RateLimitRequestHandler => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: config.skipSuccessfulRequests || false,
    keyGenerator: config.keyGenerator || ((req: Request) => req.ip as string),
    handler: (req: Request, res: Response) => {
      const identifier = config.keyGenerator
        ? config.keyGenerator(req)
        : req.ip;

      LoggingPatterns.rateLimitExceeded(
        req.path,
        identifier || "unknown",
        config.max,
        {
          windowMs: config.windowMs,
          ip: req.ip,
        }
      );

      res.status(429).json({
        error: {
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
          message: config.message,
          requestId: req.id,
          retryAfter: Math.ceil(config.windowMs / 1000),
        },
      });
    },
  });
};

/**
 * Global rate limiter for all endpoints
 */
export const globalLimiter = createRateLimiter({
  windowMs: APP_CONFIG.RATE_LIMITING.GLOBAL.WINDOW_MS,
  max: APP_CONFIG.RATE_LIMITING.GLOBAL.MAX_REQUESTS,
  message: "Too many requests from this IP. Please try again later.",
});

/**
 * Signup rate limiter - strict to prevent abuse
 * Limited per IP address
 */
export const signupLimiter = createRateLimiter({
  windowMs: APP_CONFIG.RATE_LIMITING.AUTH.SIGNUP.WINDOW_MS,
  max: APP_CONFIG.RATE_LIMITING.AUTH.SIGNUP.MAX_REQUESTS,
  message: "Too many signup attempts. Please try again in 1 hour.",
  skipSuccessfulRequests: false, // Count all attempts
});

/**
 * Login rate limiter - prevent brute force attacks
 * Limited per email address to prevent targeted attacks
 */
export const loginLimiter = createRateLimiter({
  windowMs: APP_CONFIG.RATE_LIMITING.AUTH.LOGIN.WINDOW_MS,
  max: APP_CONFIG.RATE_LIMITING.AUTH.LOGIN.MAX_REQUESTS,
  message: "Too many login attempts. Please try again in 15 minutes.",
  skipSuccessfulRequests: true, // Only count failed attempts
  keyGenerator: (req: Request) => {
    // Rate limit by email if provided, otherwise by IP
    const email = req.body?.email;
    return email ? `login:${email.toLowerCase()}` : `login:ip:${req.ip}`;
  },
});

/**
 * Password reset rate limiter
 * Limited per IP to prevent email enumeration
 */
export const passwordResetLimiter = createRateLimiter({
  windowMs: APP_CONFIG.RATE_LIMITING.AUTH.PASSWORD_RESET.WINDOW_MS,
  max: APP_CONFIG.RATE_LIMITING.AUTH.PASSWORD_RESET.MAX_REQUESTS,
  message: "Too many password reset requests. Please try again in 1 hour.",
  skipSuccessfulRequests: false,
});

/**
 * 2FA verification rate limiter
 * Strict to prevent brute force of 2FA codes
 */
export const twoFaLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts
  message: "Too many 2FA verification attempts. Please try again later.",
  keyGenerator: (req: Request) => {
    const userId = req.user?.userId || req.body?.userId;
    return userId ? `2fa:${userId}` : `2fa:ip:${req.ip}`;
  },
});

/**
 * Token refresh rate limiter
 * Moderate limit to prevent token abuse
 */
export const refreshTokenLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: "Too many token refresh attempts. Please try again later.",
  keyGenerator: (req: Request) => {
    const refreshToken = req.body?.refreshToken;
    // Rate limit by token hash or IP
    return refreshToken
      ? `refresh:${refreshToken.substring(0, 20)}`
      : `refresh:ip:${req.ip}`;
  },
});

/**
 * Email verification rate limiter
 * Prevent spamming of verification emails
 */
export const emailVerificationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: "Too many verification email requests. Please check your inbox.",
  keyGenerator: (req: Request) => {
    const email = req.body?.email;
    return email ? `verify:${email.toLowerCase()}` : `verify:ip:${req.ip}`;
  },
});

/**
 * Apply appropriate rate limiter based on endpoint sensitivity
 */
export const getRateLimiterForEndpoint = (
  endpoint: string
): RateLimitRequestHandler => {
  const limiterMap: Record<string, RateLimitRequestHandler> = {
    "/auth/signup": signupLimiter,
    "/auth/login": loginLimiter,
    "/auth/forgot-password": passwordResetLimiter,
    "/auth/reset-password": passwordResetLimiter,
    "/auth/verify-2fa": twoFaLimiter,
    "/auth/refresh": refreshTokenLimiter,
    "/auth/resend-verification": emailVerificationLimiter,
  };

  return limiterMap[endpoint] || globalLimiter;
};
