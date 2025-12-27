// src/app.ts - FIXED VERSION with proper initialization order
import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import { initializeDatabase } from "./config/database";
import { setupEventHandlers } from "./config/events";
import { AuthModule } from "./modules/auth/AuthModule";
import { errorHandler } from "./shared/middlewares/errorHandler";
import { AdvancedRequestLogger } from "./shared/middlewares/advancedLogger";
import { cacheService } from "./shared/infrastructure/cache/CacheService";
import { logger } from "./shared/utils/logger"; // ✅ FIXED: Correct import
import { HealthController } from "./shared/controllers/HealthController";
import { createRateLimiter } from "./shared/middlewares/rateLimiter";

export class App {
  public app: Application;
  private healthController: HealthController;
  private isInitialized: boolean = false;

  constructor() {
    this.app = express();
    this.healthController = new HealthController();
  }

  private configureMiddlewares(): void {
    // LAYER 1: SECURITY & INFRASTRUCTURE
    this.app.set("trust proxy", 1);

    this.app.use(
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

    this.app.use(
      cors({
        origin:
          process.env.ALLOWED_ORIGINS?.split(",") || "http://localhost:3000",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
        maxAge: 86400,
      })
    );

    // LAYER 2: REQUEST PARSING
    this.app.use(
      express.json({
        limit: "10mb",
        reviver: (key, value) => {
          if (key === "__proto__" || key === "constructor") {
            return undefined;
          }
          return value;
        },
      })
    );

    this.app.use(
      express.urlencoded({
        extended: true,
        limit: "10mb",
        parameterLimit: 10000,
      })
    );

    // LAYER 3: LOGGING & MONITORING
    this.app.use(AdvancedRequestLogger.correlationId());
    this.app.use(AdvancedRequestLogger.middleware());
    this.app.use(
      AdvancedRequestLogger.performanceMonitor({
        slow: 1000,
        critical: 5000,
      })
    );
    this.app.use(AdvancedRequestLogger.activityTracker());
    this.app.use(AdvancedRequestLogger.metricsCollector());

    // LAYER 4: GLOBAL RATE LIMITING
    const globalRateLimiter = createRateLimiter({
      windowMs: 60 * 1000,
      max: 200,
      message: "Too many requests from this IP",
    });
    this.app.use(globalRateLimiter);
  }

  private configureRoutes(): void {
    // HEALTH CHECK ROUTES (No auth required)
    this.app.get(
      "/health",
      this.healthController.check.bind(this.healthController)
    );
    this.app.get(
      "/health/readiness",
      this.healthController.readiness.bind(this.healthController)
    );
    this.app.get(
      "/health/liveness",
      this.healthController.liveness.bind(this.healthController)
    );

    // API ROUTES
    const authModule = AuthModule.getInstance();
    this.app.use("/api/auth", authModule.router);

    // 404 HANDLER
    this.app.use((req: Request, res: Response) => {
      logger.warn("404 - Route not found", {
        method: req.method,
        path: req.path,
        ip: req.ip,
        requestId: (req as any).id,
      });

      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Route not found",
          path: req.path,
        },
        requestId: (req as any).id,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private configureErrorHandling(): void {
    this.app.use(AdvancedRequestLogger.errorTracker());
    this.app.use(errorHandler);
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn("Application already initialized");
      return;
    }

    try {
      logger.info("🚀 Initializing application...");

      // Step 1: Initialize database (critical dependency)
      logger.info("Step 1/4: Initializing database connection...");
      await initializeDatabase();

      // Step 2: Initialize cache (optional but recommended)
      logger.info("Step 2/4: Initializing cache service...");
      try {
        await cacheService.connect();
      } catch (error) {
        logger.warn("Cache initialization failed, continuing without cache", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Step 3: Setup domain event handlers
      logger.info("Step 3/4: Setting up event handlers...");
      setupEventHandlers();

      // Step 4: Configure Express app
      logger.info("Step 4/4: Configuring Express middleware and routes...");
      this.configureMiddlewares();
      this.configureRoutes();
      this.configureErrorHandling();

      this.isInitialized = true;
      logger.info("✅ Application initialized successfully");
    } catch (error) {
      logger.error("❌ Failed to initialize application:", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  public async start(port: number = 3000): Promise<void> {
    try {
      await this.initialize();

      this.app.listen(port, () => {
        logger.info("🚀 Server started successfully", {
          port,
          environment: process.env.NODE_ENV,
          nodeVersion: process.version,
          pid: process.pid,
        });
        logger.info(`📚 Health check: http://localhost:${port}/health`);
        logger.info(`🔐 Auth endpoints: http://localhost:${port}/api/auth`);
      });
    } catch (error) {
      logger.error("❌ Failed to start application:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    logger.info("🛑 Shutting down application gracefully...");

    try {
      // Close cache connection
      await cacheService.disconnect();
      logger.info("Cache disconnected");

      // Close database connection
      const { closeDatabase } = await import("./config/database");
      await closeDatabase();
      logger.info("Database disconnected");

      logger.info("✅ Application shut down successfully");
    } catch (error) {
      logger.error("Error during shutdown:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
