import rateLimit from "express-rate-limit";
import { redis } from "@core/config/redis";
import { TooManyRequestsError } from "@core/errors/AppError";

/**
 * Redis Store for rate limiting
 */
class RedisStore {
  private prefix: string;
  private resetExpiryOnChange: boolean;

  constructor(
    options: { prefix?: string; resetExpiryOnChange?: boolean } = {},
  ) {
    this.prefix = options.prefix || "rl:";
    this.resetExpiryOnChange = options.resetExpiryOnChange || false;
  }

  async increment(
    key: string,
  ): Promise<{ totalHits: number; resetTime: Date }> {
    const redisKey = this.prefix + key;
    const now = Date.now();
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10);
    const resetTime = new Date(now + windowMs);

    try {
      const current = await redis.get(redisKey);

      if (!current) {
        await redis.set(redisKey, "1", "PX", windowMs);
        return { totalHits: 1, resetTime };
      }

      const totalHits = parseInt(current, 10) + 1;

      if (this.resetExpiryOnChange) {
        await redis.set(redisKey, totalHits.toString(), "PX", windowMs);
      } else {
        await redis.incr(redisKey);
      }

      return { totalHits, resetTime };
    } catch (error) {
      // Fallback if Redis fails - allow request
      return { totalHits: 1, resetTime };
    }
  }

  async decrement(key: string): Promise<void> {
    const redisKey = this.prefix + key;
    try {
      await redis.decr(redisKey);
    } catch (error) {
      // Ignore decrement errors
    }
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = this.prefix + key;
    try {
      await redis.del(redisKey);
    } catch (error) {
      // Ignore reset errors
    }
  }
}

/**
 * Default rate limiter for API endpoints
 * 100 requests per 15 minutes per IP
 */
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests:
    process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === "true",

  // Use Redis store
  store: new RedisStore() as any,

  // Custom key generator (use IP + user ID if authenticated)
  keyGenerator: (req) => {
    const userId = (req as any).user?.id;
    return userId ? `${req.ip}-${userId}` : req.ip || "unknown";
  },

  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    throw new TooManyRequestsError(
      "Too many requests from this IP, please try again later",
    );
  },

  // Skip rate limiting for certain IPs (e.g., health checks)
  skip: (req) => {
    const skipIps = (process.env.RATE_LIMIT_SKIP_IPS || "")
      .split(",")
      .filter(Boolean);
    return skipIps.includes(req.ip || "");
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,

  store: new RedisStore({ prefix: "rl:auth:" }) as any,

  keyGenerator: (req) => {
    // Use email + IP for login attempts
    const email = req.body?.email;
    return email ? `${req.ip}-${email}` : req.ip || "unknown";
  },

  handler: (req, res) => {
    throw new TooManyRequestsError(
      "Too many authentication attempts, please try again later",
    );
  },
});

/**
 * Lenient rate limiter for public endpoints
 * 1000 requests per hour per IP
 */
export const publicRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,

  store: new RedisStore({ prefix: "rl:public:" }) as any,

  handler: (req, res) => {
    throw new TooManyRequestsError("Too many requests, please try again later");
  },
});
