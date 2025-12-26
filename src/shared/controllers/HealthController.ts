import { Request, Response } from "express";
import { checkDatabaseHealth, sequelize } from "../../config/database";
import { cacheService } from "../infrastructure/cache/CacheService";

export class HealthController {
  // Update HealthController to use new methods
  async check(_req: Request, res: Response): Promise<void> {
    const dbHealth = await checkDatabaseHealth();
    const cacheHealth = await cacheService.ping();

    res.json({
      status: dbHealth.healthy ? "ok" : "degraded",
      database: dbHealth,
      cache: cacheHealth,
    });
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
