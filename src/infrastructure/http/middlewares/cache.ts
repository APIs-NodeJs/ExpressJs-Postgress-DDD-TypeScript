import { Request, Response, NextFunction } from "express";

import { RedisClient } from "@infrastructure/cache/redis";
import { logger } from "@infrastructure/logging/logger";

/**
 * Cache middleware for GET requests
 * @param ttl - Time to live in seconds (default: 300 = 5 minutes)
 */
export const cacheMiddleware = (ttl: number = 300) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Skip caching if Redis is not ready
    if (!RedisClient.isReady()) {
      logger.warn("Redis not ready, skipping cache");
      return next();
    }

    // Generate cache key
    const userId = (req as any).user?.userId || "anonymous";
    const cacheKey = `cache:${req.originalUrl}:${userId}`;

    try {
      // Try to get cached data
      const cachedData = await RedisClient.get(cacheKey);

      if (cachedData) {
        logger.debug("Cache hit", { key: cacheKey });
        res.setHeader("X-Cache", "HIT");
        return res.json(cachedData);
      }

      // Cache miss - modify response to cache it
      logger.debug("Cache miss", { key: cacheKey });
      res.setHeader("X-Cache", "MISS");

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (data: any): Response {
        // Cache the response
        RedisClient.set(cacheKey, data, ttl).catch((error) => {
          logger.error("Failed to cache response", { key: cacheKey, error });
        });

        // Call original json method
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error("Cache middleware error", { key: cacheKey, error });
      next();
    }
  };
};

/**
 * Clear cache by pattern
 */
export const clearCache = async (pattern: string): Promise<number> => {
  try {
    const deletedCount = await RedisClient.delPattern(pattern);
    logger.info("Cache cleared", { pattern, deletedCount });
    return deletedCount;
  } catch (error) {
    logger.error("Failed to clear cache", { pattern, error });
    return 0;
  }
};

/**
 * Clear user-specific cache
 */
export const clearUserCache = async (userId: string): Promise<number> => {
  return clearCache(`cache:*:${userId}`);
};

/**
 * Clear all cache
 */
export const clearAllCache = async (): Promise<number> => {
  return clearCache("cache:*");
};
