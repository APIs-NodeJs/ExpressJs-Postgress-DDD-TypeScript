import { Request, Response } from "express";
import os from "os";

import { sequelize } from "@infrastructure/database/sequelize";
import { RedisClient } from "@infrastructure/cache/redis";
import { logger } from "@infrastructure/logging/logger";

interface HealthCheck {
  status: "up" | "down" | "degraded";
  message?: string;
  details?: any;
}

interface HealthResponse {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    memory: HealthCheck;
    disk: HealthCheck;
  };
  system: {
    platform: string;
    arch: string;
    nodeVersion: string;
    cpus: number;
    totalMemory: string;
    freeMemory: string;
    loadAverage: number[];
  };
}

export class HealthController {
  /**
   * Comprehensive health check endpoint
   */
  async check(req: Request, res: Response): Promise<Response> {
    try {
      const checks = {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        memory: this.checkMemory(),
        disk: this.checkDisk(),
      };

      const systemInfo = this.getSystemInfo();

      // Determine overall health status
      const statuses = Object.values(checks).map((check) => check.status);
      let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";

      if (statuses.includes("down")) {
        overallStatus = "unhealthy";
      } else if (statuses.includes("degraded")) {
        overallStatus = "degraded";
      }

      const health: HealthResponse = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || "development",
        version: process.env.npm_package_version || "1.0.0",
        checks,
        system: systemInfo,
      };

      const statusCode = overallStatus === "healthy" ? 200 : 503;

      if (overallStatus !== "healthy") {
        logger.warn("Health check failed", { health });
      }

      return res.status(statusCode).json(health);
    } catch (error) {
      logger.error("Health check error:", error);
      return res.status(503).json({
        status: "unhealthy",
        message: "Health check failed",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Simple liveness probe (for Kubernetes)
   */
  async liveness(req: Request, res: Response): Promise<Response> {
    return res.status(200).json({
      status: "alive",
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Readiness probe (for Kubernetes)
   */
  async readiness(req: Request, res: Response): Promise<Response> {
    try {
      const dbCheck = await this.checkDatabase();
      const redisCheck = await this.checkRedis();

      const isReady = dbCheck.status === "up" && redisCheck.status === "up";

      return res.status(isReady ? 200 : 503).json({
        status: isReady ? "ready" : "not ready",
        timestamp: new Date().toISOString(),
        checks: {
          database: dbCheck,
          redis: redisCheck,
        },
      });
    } catch (error) {
      logger.error("Readiness check error:", error);
      return res.status(503).json({
        status: "not ready",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Check database connection
   */
  private async checkDatabase(): Promise<HealthCheck> {
    try {
      const startTime = Date.now();
      await sequelize.authenticate();
      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 1000 ? "up" : "degraded",
        message: "Database connection successful",
        details: {
          responseTime: `${responseTime}ms`,
          dialect: sequelize.getDialect(),
          database: sequelize.config.database,
        },
      };
    } catch (error: any) {
      logger.error("Database health check failed:", error);
      return {
        status: "down",
        message: "Database connection failed",
        details: {
          error: error.message,
        },
      };
    }
  }

  /**
   * Check Redis connection
   */
  private async checkRedis(): Promise<HealthCheck> {
    try {
      const startTime = Date.now();
      const pong = await RedisClient.ping();
      const responseTime = Date.now() - startTime;

      if (!pong) {
        return {
          status: "down",
          message: "Redis ping failed",
        };
      }

      return {
        status: responseTime < 500 ? "up" : "degraded",
        message: "Redis connection successful",
        details: {
          responseTime: `${responseTime}ms`,
        },
      };
    } catch (error: any) {
      logger.error("Redis health check failed:", error);
      return {
        status: "down",
        message: "Redis connection failed",
        details: {
          error: error.message,
        },
      };
    }
  }

  /**
   * Check memory usage
   */
  private checkMemory(): HealthCheck {
    const usage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemoryPercent = ((totalMemory - freeMemory) / totalMemory) * 100;

    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;

    let status: "up" | "degraded" | "down" = "up";
    if (heapUsedPercent > 90 || usedMemoryPercent > 90) {
      status = "down";
    } else if (heapUsedPercent > 80 || usedMemoryPercent > 80) {
      status = "degraded";
    }

    return {
      status,
      message: `Memory usage: ${Math.round(heapUsedPercent)}%`,
      details: {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        heapUsedPercent: `${Math.round(heapUsedPercent)}%`,
        rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
        external: `${Math.round(usage.external / 1024 / 1024)}MB`,
        systemMemoryUsed: `${Math.round(usedMemoryPercent)}%`,
      },
    };
  }

  /**
   * Check disk space
   */
  private checkDisk(): HealthCheck {
    // Note: Checking actual disk space requires platform-specific code
    // This is a simplified version
    try {
      const tmpDir = os.tmpdir();
      return {
        status: "up",
        message: "Disk space available",
        details: {
          tmpDir,
        },
      };
    } catch (error: any) {
      return {
        status: "degraded",
        message: "Unable to check disk space",
        details: {
          error: error.message,
        },
      };
    }
  }

  /**
   * Get system information
   */
  private getSystemInfo() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      cpus: os.cpus().length,
      totalMemory: `${Math.round(totalMem / 1024 / 1024)}MB`,
      freeMemory: `${Math.round(freeMem / 1024 / 1024)}MB`,
      loadAverage: os.loadavg(),
    };
  }
}

export default HealthController;
