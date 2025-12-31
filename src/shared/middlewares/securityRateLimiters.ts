// src/shared/middlewares/securityRateLimiters.ts
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiter for password reset requests
 * Very strict to prevent abuse
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour per IP
  message: 'Too many password reset attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  // Custom key generator (can be IP or IP + email)
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many password reset attempts. Please try again in 1 hour.',
      },
      requestId: (req as any).id,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter for login attempts
 * Prevents brute force attacks
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes per IP
  message: 'Too many login attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  keyGenerator: (req: Request) => {
    // Rate limit by IP + email combination for better security
    const email = req.body?.email || '';
    return `${req.ip}-${email}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many login attempts. Please try again in 15 minutes.',
      },
      requestId: (req as any).id,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter for registration
 * Prevents spam account creation
 */
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: 'Too many registration attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many registration attempts. Please try again in 1 hour.',
      },
      requestId: (req as any).id,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter for email verification requests
 */
export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour per IP
  message: 'Too many email verification requests.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many email verification requests. Please try again later.',
      },
      requestId: (req as any).id,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter for workspace creation
 * Prevents spam workspace creation
 */
export const workspaceCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 workspaces per hour per user
  message: 'Too many workspace creation requests.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Rate limit by user ID if authenticated
    return req.user?.userId || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many workspace creation attempts. Please try again later.',
      },
      requestId: (req as any).id,
      timestamp: new Date().toISOString(),
    });
  },
});

/**
 * Rate limiter for API calls (general)
 * Prevents API abuse
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes per IP
  message: 'Too many requests.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please try again later.',
      },
      requestId: (req as any).id,
      timestamp: new Date().toISOString(),
    });
  },
});
