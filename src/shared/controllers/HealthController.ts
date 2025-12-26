import { Request, Response } from "express";
import { sequelize } from "../../config/database";
import { cacheService } from "../infrastructure/cache/CacheService";

export class HealthController {
  async check(req: Request, res: Response): Promise<void> {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      services: {
        database: "unknown",
        cache: "unknown",
      },
    };

    // Check database
    try {
      await sequelize.authenticate();
      health.services.database = "healthy";
    } catch (error) {
      health.services.database = "unhealthy";
      health.status = "degraded";
    }

    // Check cache
    if (cacheService) {
      health.services.cache = "healthy";
    }

    const statusCode = health.status === "ok" ? 200 : 503;
    res.status(statusCode).json(health);
  }

  async readiness(req: Request, res: Response): Promise<void> {
    try {
      await sequelize.authenticate();
      res.status(200).json({ ready: true });
    } catch (error) {
      res.status(503).json({ ready: false });
    }
  }

  async liveness(req: Request, res: Response): Promise<void> {
    res.status(200).json({ alive: true });
  }
}
