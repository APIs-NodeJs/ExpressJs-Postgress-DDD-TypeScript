import { createClient, RedisClientType } from "redis";
import { config } from "../../../config/env.config";
import { logger } from "../../../shared/utils/logger";

enum CircuitState {
  CLOSED = "CLOSED", // Normal operation
  OPEN = "OPEN", // Too many failures, stop trying
  HALF_OPEN = "HALF_OPEN", // Testing if service recovered
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number; // ms
  halfOpenAttempts: number;
}

export class CacheService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  // Circuit breaker state
  private circuitState: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;

  private circuitConfig: CircuitBreakerConfig = {
    failureThreshold: 5, // Open circuit after 5 failures
    recoveryTimeout: 60000, // Try to recover after 60 seconds
    halfOpenAttempts: 3, // Need 3 successes to close circuit
  };

  async connect(): Promise<void> {
    if (!config.REDIS_HOST) {
      logger.warn("Redis not configured, caching disabled");
      return;
    }

    try {
      this.client = createClient({
        socket: {
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            // Exponential backoff with max 3 seconds
            const delay = Math.min(retries * 50, 3000);
            logger.info(
              `Redis reconnection attempt ${retries}, waiting ${delay}ms`
            );
            return delay;
          },
        },
        password: config.REDIS_PASSWORD,
      });

      // Event handlers
      this.client.on("error", (err) => {
        logger.error("Redis client error:", err);
        this.handleFailure();
      });

      this.client.on("connect", () => {
        logger.info("Redis connecting...");
      });

      this.client.on("ready", () => {
        logger.info("✅ Redis connection established");
        this.isConnected = true;
        this.resetCircuit();
      });

      this.client.on("reconnecting", () => {
        logger.warn("Redis reconnecting...");
        this.isConnected = false;
      });

      this.client.on("end", () => {
        logger.warn("Redis connection closed");
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error("❌ Redis connection failed:", error);
      this.handleFailure();
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        this.isConnected = false;
        logger.info("Redis connection closed gracefully");
      } catch (error) {
        logger.error("Error closing Redis connection:", error);
      }
    }
  }

  private handleFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.circuitState === CircuitState.HALF_OPEN) {
      // Failed during recovery attempt, go back to OPEN
      this.circuitState = CircuitState.OPEN;
      this.successCount = 0;
      logger.warn("Circuit breaker: Recovery failed, reopening circuit");
    } else if (
      this.circuitState === CircuitState.CLOSED &&
      this.failureCount >= this.circuitConfig.failureThreshold
    ) {
      // Too many failures, open the circuit
      this.circuitState = CircuitState.OPEN;
      logger.error(
        `Circuit breaker: Opened after ${this.failureCount} failures`
      );
    }
  }

  private handleSuccess(): void {
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.circuitConfig.halfOpenAttempts) {
        // Recovered successfully, close the circuit
        this.resetCircuit();
        logger.info("Circuit breaker: Closed after successful recovery");
      }
    } else if (this.circuitState === CircuitState.CLOSED) {
      // Reset failure count on success
      this.failureCount = 0;
    }
  }

  private resetCircuit(): void {
    this.circuitState = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
  }

  private shouldAttemptOperation(): boolean {
    // Circuit is closed, allow operation
    if (this.circuitState === CircuitState.CLOSED) {
      return true;
    }

    // Circuit is open, check if recovery timeout passed
    if (this.circuitState === CircuitState.OPEN) {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure >= this.circuitConfig.recoveryTimeout) {
        // Try to recover
        this.circuitState = CircuitState.HALF_OPEN;
        this.successCount = 0;
        logger.info("Circuit breaker: Attempting recovery (HALF_OPEN)");
        return true;
      }
      return false; // Still in timeout period
    }

    // Circuit is half-open, allow operation to test recovery
    return true;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client || !this.shouldAttemptOperation()) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      this.handleSuccess();
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error("Cache get error:", { key, error });
      this.handleFailure();
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    if (!this.isConnected || !this.client || !this.shouldAttemptOperation()) {
      return;
    }

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      this.handleSuccess();
    } catch (error) {
      logger.error("Cache set error:", { key, error });
      this.handleFailure();
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client || !this.shouldAttemptOperation()) {
      return;
    }

    try {
      await this.client.del(key);
      this.handleSuccess();
    } catch (error) {
      logger.error("Cache delete error:", { key, error });
      this.handleFailure();
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.client || !this.shouldAttemptOperation()) {
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      this.handleSuccess();
    } catch (error) {
      logger.error("Cache invalidate error:", { pattern, error });
      this.handleFailure();
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client || !this.shouldAttemptOperation()) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      this.handleSuccess();
      return result === 1;
    } catch (error) {
      logger.error("Cache exists error:", { key, error });
      this.handleFailure();
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.isConnected || !this.client || !this.shouldAttemptOperation()) {
      return -1;
    }

    try {
      const result = await this.client.ttl(key);
      this.handleSuccess();
      return result;
    } catch (error) {
      logger.error("Cache TTL error:", { key, error });
      this.handleFailure();
      return -1;
    }
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    if (!this.isConnected || !this.client || !this.shouldAttemptOperation()) {
      return 0;
    }

    try {
      const result = await this.client.incrBy(key, amount);
      this.handleSuccess();
      return result;
    } catch (error) {
      logger.error("Cache increment error:", { key, error });
      this.handleFailure();
      return 0;
    }
  }

  async setWithExpiry(key: string, value: any, ttl: number): Promise<boolean> {
    if (!this.isConnected || !this.client || !this.shouldAttemptOperation()) {
      return false;
    }

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      this.handleSuccess();
      return true;
    } catch (error) {
      logger.error("Cache setWithExpiry error:", { key, error });
      this.handleFailure();
      return false;
    }
  }

  // Health check method
  async ping(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === "PONG";
    } catch (error) {
      logger.error("Cache ping error:", error);
      return false;
    }
  }

  // Get circuit breaker status
  getStatus() {
    return {
      connected: this.isConnected,
      circuitState: this.circuitState,
      failureCount: this.failureCount,
      successCount: this.successCount,
    };
  }
}

export const cacheService = new CacheService();
