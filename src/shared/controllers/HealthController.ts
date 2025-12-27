// src/shared/controllers/HealthController.ts - UPDATED
import { Request, Response } from "express";
import { checkDatabaseHealth, getPoolManager } from "../../config/database";
import { cacheService } from "../infrastructure/cache/CacheService";
import { logger } from "../utils/logger";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    memory: MemoryHealth;
  };
  metrics?: {
    requests?: any;
    errors?: any;
    performance?: any;
  };
}

interface ServiceHealth {
  status: "up" | "down" | "degraded";
  latency?: number;
  details?: any;
  error?: string;
}

interface MemoryHealth {
  status: "healthy" | "warning" | "critical";
  used: string;
  total: string;
  percentage: number;
}

export class HealthController {
  /**
   * Comprehensive health check
   * GET /health
   */
  async check(_req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Check all services in parallel
      const [dbHealth, cacheHealth, memoryHealth] = await Promise.all([
        this.checkDatabase(),
        this.checkCache(),
        this.checkMemory(),
      ]);

      // Calculate overall status
      const overallStatus = this.calculateOverallStatus([
        dbHealth.status,
        cacheHealth.status,
        memoryHealth.status,
      ]);

      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        services: {
          database: dbHealth,
          cache: cacheHealth,
          memory: memoryHealth,
        },
      };

      // Add database pool statistics if available
      const poolManager = getPoolManager();
      if (poolManager) {
        healthStatus.services.database.details = {
          ...healthStatus.services.database.details,
          pool: poolManager.getStatistics(),
          recommendations: poolManager.getRecommendations(),
        };
      }

      // Log health check
      const duration = Date.now() - startTime;
      logger.info("Health check completed", {
        status: overallStatus,
        duration: `${duration}ms`,
        services: {
          database: dbHealth.status,
          cache: cacheHealth.status,
          memory: memoryHealth.status,
        },
      });

      // Set appropriate status code
      const statusCode =
        overallStatus === "healthy"
          ? 200
          : overallStatus === "degraded"
            ? 200
            : 503;

      res.status(statusCode).json(healthStatus);
    } catch (error) {
      logger.error("Health check failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      });
    }
  }

  /**
   * Kubernetes readiness probe
   * GET /health/readiness
   */
  async readiness(_req: Request, res: Response): Promise<void> {
    try {
      // Check critical services
      const dbHealth = await checkDatabaseHealth();

      if (!dbHealth.healthy) {
        res.status(503).json({
          ready: false,
          reason: "Database not available",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Readiness check failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      res.status(503).json({
        ready: false,
        reason: "Service not ready",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Kubernetes liveness probe
   * GET /health/liveness
   */
  async liveness(_req: Request, res: Response): Promise<void> {
    // Simple check - if we can respond, we're alive
    res.status(200).json({
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const health = await checkDatabaseHealth();
      const latency = Date.now() - startTime;

      return {
        status: health.healthy ? "up" : "down",
        latency,
        details: health.details,
      };
    } catch (error) {
      return {
        status: "down",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check cache health
   */
  private async checkCache(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const isHealthy = await cacheService.ping();
      const latency = Date.now() - startTime;
      const status = cacheService.getStatus();

      return {
        status: isHealthy
          ? "up"
          : status.circuitState === "OPEN"
            ? "down"
            : "degraded",
        latency,
        details: status,
      };
    } catch (error) {
      return {
        status: "down",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check memory health
   */
  private async checkMemory(): Promise<MemoryHealth> {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const percentage = (usedMemory / totalMemory) * 100;

    // Determine status based on memory usage
    let status: "healthy" | "warning" | "critical";
    if (percentage < 70) {
      status = "healthy";
    } else if (percentage < 85) {
      status = "warning";
    } else {
      status = "critical";
    }

    return {
      status,
      used: `${(usedMemory / 1024 / 1024).toFixed(2)}MB`,
      total: `${(totalMemory / 1024 / 1024).toFixed(2)}MB`,
      percentage: parseFloat(percentage.toFixed(2)),
    };
  }

  /**
   * Calculate overall system status
   */
  private calculateOverallStatus(
    serviceStatuses: string[]
  ): "healthy" | "degraded" | "unhealthy" {
    const hasDown = serviceStatuses.some((s) => s === "down");
    const hasDegraded = serviceStatuses.some((s) => s === "degraded");
    const hasCritical = serviceStatuses.some((s) => s === "critical");

    if (hasDown || hasCritical) {
      return "unhealthy";
    }
    if (hasDegraded) {
      return "degraded";
    }
    return "healthy";
  }
}
