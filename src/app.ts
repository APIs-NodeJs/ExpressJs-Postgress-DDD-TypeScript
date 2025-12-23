import express, { Application, Request, Response } from "express";
import helmet from "helmet";

import { config } from "@config/env";
import { corsMiddleware } from "@infrastructure/http/middlewares/cors";
import { requestIdMiddleware } from "@infrastructure/http/middlewares/requestId";
import { errorHandler } from "@infrastructure/http/middlewares/errorHandler";
import { requestLogger } from "@infrastructure/logging/logger";
import { compressionMiddleware } from "@infrastructure/http/middlewares/compression";
import {
  sqlInjectionProtection,
  xssProtection,
  advancedRateLimiter,
} from "@infrastructure/http/middlewares/security";
import { setupSwagger } from "@infrastructure/http/swagger";

// Routes
import authRoutes from "@modules/auth/presentation/routes/auth.routes";
import settingsRoutes from "@modules/settings/presentation/routes/settings.routes";
import corsRoutes from "@infrastructure/http/routes/cors.routes";

// Controllers
import HealthController from "@infrastructure/http/controllers/HealthController";

export function createApp(): Application {
  const app = express();

  // ============================================================================
  // SECURITY MIDDLEWARE (First layer)
  // ============================================================================
  app.use(helmet());
  app.use(corsMiddleware);

  // ============================================================================
  // BODY PARSING
  // ============================================================================
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // ============================================================================
  // COMPRESSION
  // ============================================================================
  app.use(compressionMiddleware);

  // ============================================================================
  // REQUEST TRACKING & LOGGING
  // ============================================================================
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // ============================================================================
  // SECURITY PROTECTIONS
  // ============================================================================
  app.use(sqlInjectionProtection);
  app.use(xssProtection);
  app.use(advancedRateLimiter);

  // ============================================================================
  // API DOCUMENTATION
  // ============================================================================
  setupSwagger(app);

  // ============================================================================
  // HEALTH CHECK ENDPOINTS
  // ============================================================================
  const healthController = new HealthController();

  app.get("/health", healthController.check.bind(healthController));
  app.get("/health/liveness", healthController.liveness.bind(healthController));
  app.get("/health/readiness", healthController.readiness.bind(healthController));

  // ============================================================================
  // API ROUTES
  // ============================================================================
  const apiPrefix = config.app.apiPrefix;

  // Root API info
  app.get(apiPrefix, (req: Request, res: Response) => {
    res.json({
      name: config.app.name,
      version: "1.0.0",
      status: "running",
      documentation: `${apiPrefix}/docs`,
      health: "/health",
      endpoints: {
        auth: `${apiPrefix}/auth`,
        settings: `${apiPrefix}/users`,
        admin: `${apiPrefix}/admin`,
      },
    });
  });

  // Authentication routes
  app.use(`${apiPrefix}/auth`, authRoutes);

  // User settings routes
  app.use(`${apiPrefix}/users`, settingsRoutes);

  // Admin routes
  app.use(`${apiPrefix}/admin/cors`, corsRoutes);

  // ============================================================================
  // 404 HANDLER
  // ============================================================================
  app.use("*", (req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
        path: req.originalUrl,
        requestId: res.locals.requestId,
      },
    });
  });

  // ============================================================================
  // ERROR HANDLER (Must be last)
  // ============================================================================
  app.use(errorHandler);

  return app;
}