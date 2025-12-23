import Redis from "ioredis";

import { logger } from "@infrastructure/logging/logger";

export class RedisClient {
  private static instance: Redis | null = null;
  private static isConnected = false;

  /**
   * Get Redis instance (Singleton pattern)
   */
  static getInstance(): Redis {
    if (!this.instance) {
      this.instance = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || "0"),
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          logger.warn(`Redis retry attempt ${times}, waiting ${delay}ms`);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      });

      // Event handlers
      this.instance.on("connect", () => {
        logger.info("Redis connecting...");
      });

      this.instance.on("ready", () => {
        this.isConnected = true;
        logger.info("Redis connection established successfully");
      });

      this.instance.on("error", (err: Error) => {
        this.isConnected = false;
        logger.error("Redis connection error:", { error: err.message });
      });

      this.instance.on("close", () => {
        this.isConnected = false;
        logger.warn("Redis connection closed");
      });

      this.instance.on("reconnecting", () => {
        logger.info("Redis reconnecting...");
      });
    }

    return this.instance;
  }

  /**
   * Check if Redis is connected
   */
  static isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Get value from Redis
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.getInstance().get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error("Redis GET error:", { key, error });
      return null;
    }
  }

  /**
   * Set value in Redis with expiry
   */
  static async set(
    key: string,
    value: any,
    expirySeconds = 3600
  ): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await this.getInstance().setex(key, expirySeconds, serialized);
      return true;
    } catch (error) {
      logger.error("Redis SET error:", { key, error });
      return false;
    }
  }

  /**
   * Set value without expiry
   */
  static async setPermanent(key: string, value: any): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      await this.getInstance().set(key, serialized);
      return true;
    } catch (error) {
      logger.error("Redis SET error:", { key, error });
      return false;
    }
  }

  /**
   * Delete key from Redis
   */
  static async del(key: string): Promise<boolean> {
    try {
      await this.getInstance().del(key);
      return true;
    } catch (error) {
      logger.error("Redis DEL error:", { key, error });
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  static async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.getInstance().keys(pattern);
      if (keys.length === 0) return 0;
      await this.getInstance().del(...keys);
      return keys.length;
    } catch (error) {
      logger.error("Redis DEL pattern error:", { pattern, error });
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await this.getInstance().exists(key);
      return result === 1;
    } catch (error) {
      logger.error("Redis EXISTS error:", { key, error });
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  static async ttl(key: string): Promise<number> {
    try {
      return await this.getInstance().ttl(key);
    } catch (error) {
      logger.error("Redis TTL error:", { key, error });
      return -1;
    }
  }

  /**
   * Increment counter
   */
  static async incr(key: string): Promise<number> {
    try {
      return await this.getInstance().incr(key);
    } catch (error) {
      logger.error("Redis INCR error:", { key, error });
      return 0;
    }
  }

  /**
   * Decrement counter
   */
  static async decr(key: string): Promise<number> {
    try {
      return await this.getInstance().decr(key);
    } catch (error) {
      logger.error("Redis DECR error:", { key, error });
      return 0;
    }
  }

  /**
   * Flush all data (use with caution)
   */
  static async flush(): Promise<boolean> {
    try {
      await this.getInstance().flushall();
      logger.warn("Redis database flushed");
      return true;
    } catch (error) {
      logger.error("Redis FLUSH error:", { error });
      return false;
    }
  }

  /**
   * Get all keys matching pattern
   */
  static async keys(pattern: string): Promise<string[]> {
    try {
      return await this.getInstance().keys(pattern);
    } catch (error) {
      logger.error("Redis KEYS error:", { pattern, error });
      return [];
    }
  }

  /**
   * Close Redis connection
   */
  static async disconnect(): Promise<void> {
    try {
      if (this.instance) {
        await this.instance.quit();
        this.instance = null;
        this.isConnected = false;
        logger.info("Redis disconnected gracefully");
      }
    } catch (error) {
      logger.error("Redis disconnect error:", { error });
    }
  }

  /**
   * Ping Redis to check connection
   */
  static async ping(): Promise<boolean> {
    try {
      const response = await this.getInstance().ping();
      return response === "PONG";
    } catch (error) {
      logger.error("Redis PING error:", { error });
      return false;
    }
  }
}

// Initialize Redis on import
RedisClient.getInstance();
