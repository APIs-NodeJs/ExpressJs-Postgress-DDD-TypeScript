import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { createClient } from "redis";
import { config } from "../../config/env.config";

const redisClient = config.REDIS_HOST
  ? createClient({
      socket: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
      },
      password: config.REDIS_PASSWORD,
    })
  : null;

export const createRateLimiter = (options?: {
  windowMs?: number;
  max?: number;
  message?: string;
}) => {
  return rateLimit({
    windowMs: options?.windowMs || config.RATE_LIMIT_WINDOW,
    max: options?.max || config.RATE_LIMIT_MAX,
    message: options?.message || "Too many requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
    store: redisClient
      ? new RedisStore({
          client: redisClient,
          prefix: "rl:",
        })
      : undefined,
    handler: (req, res) => {
      logger.warn("Rate limit exceeded", {
        ip: req.ip,
        path: req.path,
        requestId: req.id,
      });

      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: options?.message || "Too many requests",
        },
      });
    },
  });
};

// Specific rate limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: "Too many login attempts, please try again later",
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
