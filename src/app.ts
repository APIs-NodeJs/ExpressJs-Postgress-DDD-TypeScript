// src/app.ts - Updated with Admin routes
import express, { Application } from "express";
import helmet from "helmet";
import { corsMiddleware } from "@infrastructure/http/middlewares/cors";
import { rateLimiter } from "@infrastructure/http/middlewares/rateLimiter";
import { requestIdMiddleware } from "@infrastructure/http/middlewares/requestId";
import { errorHandler } from "@infrastructure/http/middlewares/errorHandler";
import { config } from "@config/env";

// Routes
import authRoutes from "@modules/auth/presentation/routes/auth.routes";
import settingsRoutes from "@modules/settings/presentation/routes/settings.routes";
import corsRoutes from "@infrastructure/http/routes/cors.routes";

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(corsMiddleware);

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request tracking
  app.use(requestIdMiddleware);

  // Rate limiting
  app.use(rateLimiter);

  // Health check
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API Routes
  const apiPrefix = config.app.apiPrefix;

  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, settingsRoutes);

  // CORS management routes (owner only)
  app.use(`${apiPrefix}/admin/cors`, corsRoutes);

  // 404 handler
  app.use("*", (req, res) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
        requestId: res.locals.requestId,
      },
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
