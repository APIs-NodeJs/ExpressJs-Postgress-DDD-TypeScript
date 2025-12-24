import express, { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env, isProduction } from "./config/env";
import { routes } from "./infrastructure/http/routes";
import { metricsRoutes } from "./infrastructure/http/routes/metricsRoutes";
import { errorHandler } from "./infrastructure/http/middlewares/errorHandler";
import { requestId } from "./infrastructure/http/middlewares/requestId";
import { requestLogger } from "./infrastructure/http/middlewares/requestLogger";
import { metricsMiddleware } from "./infrastructure/http/middlewares/metricsMiddleware";
import { notFoundHandler } from "./infrastructure/http/middlewares/notFoundHandler";
import { sanitizeInput } from "./infrastructure/http/middlewares/sanitizeInput";
import { Logger } from "./shared/infrastructure/logger/logger";
import {
  initializeSentry,
  getSentryHandlers,
} from "./infrastructure/monitoring/sentry";

export function createApp(): Application {
  const app = express();

  // Initialize Sentry FIRST
  initializeSentry(app);
  const sentryHandlers = getSentryHandlers();

  // Sentry request handler must be first
  app.use(sentryHandlers.requestHandler);
  app.use(sentryHandlers.tracingHandler);

  // Trust proxy
  if (isProduction) {
    app.set("trust proxy", 1);
  }

  // Security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  // CORS
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (env.ALLOWED_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          Logger.security("CORS violation", { origin });
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
      exposedHeaders: ["X-Request-ID"],
      maxAge: 86400,
    })
  );

  // Rate limiting
  const globalLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      Logger.security("Rate limit exceeded", { ip: req.ip, path: req.path });
      res.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests, please try again later.",
        },
      });
    },
  });
  app.use(globalLimiter);

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Custom middleware
  app.use(requestId);
  app.use(metricsMiddleware); // ✅ NEW: Track metrics
  app.use(requestLogger);
  app.use(sanitizeInput);

  // Health check
  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
    });
  });

  // Routes
  app.use(routes);
  app.use(metricsRoutes); // ✅ NEW: Metrics endpoint

  // 404 handler
  app.use(notFoundHandler);

  // Sentry error handler BEFORE custom error handler
  app.use(sentryHandlers.errorHandler);

  // Error handler must be last
  app.use(errorHandler);

  return app;
}
