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
import productRoutes from "@modules/products/presentation/routes/product.routes";
import featureRoutes from "@modules/features/presentation/routes/feature.routes";
import taskRoutes from "@modules/tasks/presentation/routes/task.routes";
import bugRoutes from "@modules/bugs/presentation/routes/bug.routes";
import sprintRoutes from "@modules/sprints/presentation/routes/sprint.routes";
import releaseRoutes from "@modules/releases/presentation/routes/release.routes";
import teamRoutes from "@modules/team/presentation/routes/team.routes";
import analyticsRoutes from "@modules/analytics/presentation/routes/analytics.routes";
import settingsRoutes from "@modules/settings/presentation/routes/settings.routes";
import dashboardRoutes from "@modules/dashboard/presentation/routes/dashboard.routes";
import billingRoutes from "@modules/billing/presentation/routes/billing.routes";
import adminRoutes from "@modules/admin/presentation/routes/admin.routes";
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
  app.use(`${apiPrefix}/products`, productRoutes);
  app.use(`${apiPrefix}/features`, featureRoutes);
  app.use(`${apiPrefix}/tasks`, taskRoutes);
  app.use(`${apiPrefix}/bugs`, bugRoutes);
  app.use(`${apiPrefix}/sprints`, sprintRoutes);
  app.use(`${apiPrefix}/releases`, releaseRoutes);
  app.use(`${apiPrefix}/team`, teamRoutes);
  app.use(`${apiPrefix}/analytics`, analyticsRoutes);
  app.use(`${apiPrefix}/users`, settingsRoutes);
  app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
  app.use(`${apiPrefix}/billing`, billingRoutes);

  // Admin routes (owner + admin only)
  app.use(`${apiPrefix}/admin`, adminRoutes);

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
