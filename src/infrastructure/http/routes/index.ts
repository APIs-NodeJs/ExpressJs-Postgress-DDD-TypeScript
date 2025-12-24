import { Router, Request, Response } from "express";
import { authRoutes } from "../../../modules/auth/presentation/routes/authRoutes";
import { APP_CONSTANTS } from "../../../config/constants";
import { checkDatabaseHealth } from "../../../config/database";
import { env } from "../../../config/env";

const router = Router();

/**
 * Basic health check endpoint
 * Returns 200 if the service is running
 */
router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: "1.0.0",
  });
});

/**
 * Detailed health check endpoint
 * Checks database connectivity and other dependencies
 */
router.get("/health/detailed", async (req: Request, res: Response) => {
  const startTime = Date.now();

  // Check database
  const dbHealthy = await checkDatabaseHealth();

  const health = {
    status: dbHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: "1.0.0",
    checks: {
      database: {
        status: dbHealthy ? "up" : "down",
        responseTime: Date.now() - startTime,
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: "MB",
      },
    },
  };

  const statusCode = dbHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * Readiness probe - checks if service is ready to accept traffic
 */
router.get("/ready", async (req: Request, res: Response) => {
  const dbHealthy = await checkDatabaseHealth();

  if (dbHealthy) {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false, reason: "Database not ready" });
  }
});

/**
 * Liveness probe - checks if service is alive
 */
router.get("/live", (req: Request, res: Response) => {
  res.status(200).json({ alive: true });
});

// API routes
router.use(`${APP_CONSTANTS.API_PREFIX}/auth`, authRoutes);

// API documentation route
router.get(`${APP_CONSTANTS.API_PREFIX}`, (req: Request, res: Response) => {
  res.json({
    message: "Devcycle API",
    version: "1.0.0",
    documentation: "/api/v1/docs",
    endpoints: {
      health: "/health",
      detailedHealth: "/health/detailed",
      auth: {
        signup: "POST /api/v1/auth/signup",
        login: "POST /api/v1/auth/login",
        me: "GET /api/v1/auth/me",
        refresh: "POST /api/v1/auth/refresh",
        logout: "POST /api/v1/auth/logout",
      },
    },
  });
});

export { router as routes };
