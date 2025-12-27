import { Sequelize } from "sequelize";
import { logger } from "../../utils/logger";
import { EventEmitter } from "events";

interface PoolMetrics {
  size: number;
  available: number;
  using: number;
  waiting: number;
  maxWaitTime: number;
  avgWaitTime: number;
  totalAcquired: number;
  totalReleased: number;
  totalCreated: number;
  totalDestroyed: number;
}

interface ConnectionHealth {
  healthy: boolean;
  latency: number;
  lastCheck: Date;
  consecutiveFailures: number;
}

export class ConnectionPoolManager extends EventEmitter {
  private sequelize: Sequelize;
  private metrics: PoolMetrics;
  private healthStatus: ConnectionHealth;
  private monitoringInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly METRICS_INTERVAL = 60000; // 1 minute
  private readonly MAX_CONSECUTIVE_FAILURES = 3;

  constructor(sequelize: Sequelize) {
    super();
    this.sequelize = sequelize;
    this.metrics = this.initializeMetrics();
    this.healthStatus = {
      healthy: true,
      latency: 0,
      lastCheck: new Date(),
      consecutiveFailures: 0,
    };
  }

  private initializeMetrics(): PoolMetrics {
    return {
      size: 0,
      available: 0,
      using: 0,
      waiting: 0,
      maxWaitTime: 0,
      avgWaitTime: 0,
      totalAcquired: 0,
      totalReleased: 0,
      totalCreated: 0,
      totalDestroyed: 0,
    };
  }

  /**
   * Start monitoring the connection pool
   */
  public startMonitoring(): void {
    // Health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);

    // Metrics collection
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.METRICS_INTERVAL);

    logger.info("Connection pool monitoring started");
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    logger.info("Connection pool monitoring stopped");
  }

  /**
   * Perform health check on the connection pool
   */
  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();

    try {
      // Simple query to check connection
      await this.sequelize.query("SELECT 1");

      const latency = Date.now() - startTime;

      this.healthStatus = {
        healthy: true,
        latency,
        lastCheck: new Date(),
        consecutiveFailures: 0,
      };

      // Warn if latency is high
      if (latency > 1000) {
        logger.warn("High database latency detected", {
          latency: `${latency}ms`,
          threshold: "1000ms",
        });
        this.emit("high-latency", { latency });
      }
    } catch (error) {
      this.healthStatus.consecutiveFailures++;
      this.healthStatus.lastCheck = new Date();

      logger.error("Database health check failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        consecutiveFailures: this.healthStatus.consecutiveFailures,
      });

      // Mark as unhealthy after multiple failures
      if (
        this.healthStatus.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES
      ) {
        this.healthStatus.healthy = false;
        this.emit("unhealthy", {
          failures: this.healthStatus.consecutiveFailures,
        });

        logger.error("Database marked as unhealthy", {
          consecutiveFailures: this.healthStatus.consecutiveFailures,
        });
      }
    }
  }

  /**
   * Collect pool metrics
   */
  private collectMetrics(): void {
    try {
      const connectionManager = this.sequelize.connectionManager as any;
      const pool = connectionManager?.pool;

      if (!pool) {
        logger.warn("Connection pool not available for metrics collection");
        return;
      }

      // Update metrics
      this.metrics = {
        size: pool.size || 0,
        available: pool.available || 0,
        using: (pool.size || 0) - (pool.available || 0),
        waiting: pool.pending || 0,
        maxWaitTime: pool.maxWaitTime || 0,
        avgWaitTime: pool.avgWaitTime || 0,
        totalAcquired: this.metrics.totalAcquired,
        totalReleased: this.metrics.totalReleased,
        totalCreated: this.metrics.totalCreated,
        totalDestroyed: this.metrics.totalDestroyed,
      };

      // Log metrics
      logger.debug("Connection pool metrics", this.metrics);

      // Check for pool exhaustion
      if (this.metrics.available === 0 && this.metrics.waiting > 0) {
        logger.warn("Connection pool exhausted", {
          waiting: this.metrics.waiting,
          using: this.metrics.using,
          size: this.metrics.size,
        });
        this.emit("pool-exhausted", this.metrics);
      }

      // Check for high usage
      const usagePercent = (this.metrics.using / this.metrics.size) * 100;
      if (usagePercent > 80) {
        logger.warn("High connection pool usage", {
          usage: `${usagePercent.toFixed(1)}%`,
          using: this.metrics.using,
          size: this.metrics.size,
        });
        this.emit("high-usage", { usagePercent, metrics: this.metrics });
      }
    } catch (error) {
      logger.error("Failed to collect pool metrics", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get current pool metrics
   */
  public getMetrics(): PoolMetrics {
    return { ...this.metrics };
  }

  /**
   * Get health status
   */
  public getHealthStatus(): ConnectionHealth {
    return { ...this.healthStatus };
  }

  /**
   * Get pool statistics
   */
  public getStatistics() {
    return {
      metrics: this.getMetrics(),
      health: this.getHealthStatus(),
      utilizationPercent:
        this.metrics.size > 0
          ? ((this.metrics.using / this.metrics.size) * 100).toFixed(2)
          : 0,
      efficiency: {
        hitRate:
          this.metrics.totalAcquired > 0
            ? (
                (this.metrics.totalAcquired /
                  (this.metrics.totalAcquired + this.metrics.totalCreated)) *
                100
              ).toFixed(2)
            : 100,
      },
    };
  }

  /**
   * Force pool to drain and refill (useful for maintenance)
   */
  public async drainPool(): Promise<void> {
    try {
      logger.info("Draining connection pool");

      const connectionManager = this.sequelize.connectionManager as any;
      const pool = connectionManager?.pool;

      if (pool && typeof pool.drain === "function") {
        await pool.drain();
        logger.info("Connection pool drained successfully");
      }
    } catch (error) {
      logger.error("Failed to drain connection pool", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Test connection acquisition time
   */
  public async testConnectionSpeed(): Promise<{
    success: boolean;
    duration: number;
  }> {
    const startTime = Date.now();

    try {
      await this.sequelize.query("SELECT 1");
      const duration = Date.now() - startTime;

      return { success: true, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Connection speed test failed", {
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return { success: false, duration };
    }
  }

  /**
   * Get connection pool recommendations
   */
  public getRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.metrics;

    // Check if pool size is too small
    if (metrics.waiting > metrics.available && metrics.waiting > 5) {
      recommendations.push(
        `Consider increasing pool size. Current: ${metrics.size}, Waiting connections: ${metrics.waiting}`
      );
    }

    // Check if pool size is too large
    if (
      metrics.size > 10 &&
      metrics.using < metrics.size * 0.3 &&
      metrics.waiting === 0
    ) {
      recommendations.push(
        `Pool might be oversized. Usage: ${metrics.using}/${metrics.size} (${((metrics.using / metrics.size) * 100).toFixed(1)}%)`
      );
    }

    // Check latency
    if (this.healthStatus.latency > 500) {
      recommendations.push(
        `High database latency detected: ${this.healthStatus.latency}ms. Check database performance.`
      );
    }

    // Check consecutive failures
    if (this.healthStatus.consecutiveFailures > 0) {
      recommendations.push(
        `Database connection issues detected: ${this.healthStatus.consecutiveFailures} consecutive failures`
      );
    }

    return recommendations;
  }
}
