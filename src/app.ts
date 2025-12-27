import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { initializeDatabase } from "./config/database";
import { setupEventHandlers } from "./config/events";
import { AuthModule } from "./modules/auth/AuthModule";
import { errorHandler } from "./shared/middlewares/errorHandler";
import {
  requestLogger,
  correlationId,
  performanceMonitor,
  activityTracker,
} from "./shared/middlewares/requestLogger";
import { sanitizeRequest } from "./shared/middlewares/sanitizeRequest";
import { requestTimeout } from "./shared/middlewares/requestTimeout";
import { cacheService } from "./shared/infrastructure/cache/CacheService";
import { logger } from "./shared/utils/logger";
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

  /**
   * Configure security and infrastructure middleware
   */
  private configureSecurityMiddleware(): void {
    // Trust proxy for correct IP detection
    this.app.set("trust proxy", 1);

    // Helmet for security headers
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

    // CORS configuration
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

    // Compression
    this.app.use(compression());
  }

  /**
   * Configure request parsing middleware
   */
  private configureParsingMiddleware(): void {
    // JSON parser with security
    this.app.use(
      express.json({
        limit: "10mb",
        reviver: (key, value) => {
          // Prevent prototype pollution
          if (key === "__proto__" || key === "constructor") {
            return undefined;
          }
          return value;
        },
      })
    );

    // URL encoded parser
    this.app.use(
      express.urlencoded({
        extended: true,
        limit: "10mb",
        parameterLimit: 10000,
      })
    );
  }

  /**
   * Configure logging and monitoring middleware
   */
  private configureLoggingMiddleware(): void {
    this.app.use(correlationId());
    this.app.use(requestLogger());
    this.app.use(performanceMonitor({ slow: 1000, critical: 5000 }));
    this.app.use(activityTracker());
  }

  /**
   * Configure security and validation middleware
   */
  private configureValidationMiddleware(): void {
    this.app.use(sanitizeRequest);
    this.app.use(requestTimeout({ timeout: 30000 }));
  }

  /**
   * Configure rate limiting
   */
  private configureRateLimiting(): void {
    const globalRateLimiter = createRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      max: 200,
      message: "Too many requests from this IP",
    });
    this.app.use(globalRateLimiter);
  }

  /**
   * Configure application routes
   */
  private configureRoutes(): void {
    // Health check routes (no auth required)
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

    // API routes
    const authModule = AuthModule.getInstance();
    this.app.use("/api/auth", authModule.router);

    // 404 handler
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

  /**
   * Configure error handling
   */
  private configureErrorHandling(): void {
    this.app.use(errorHandler);
  }

  /**
   * Initialize application
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn("Application already initialized");
      return;
    }

    try {
      logger.info("🚀 Initializing application...");

      // Step 1: Initialize database
      logger.info("Step 1/4: Initializing database connection...");
      await initializeDatabase();

      // Step 2: Initialize cache (optional)
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
      this.configureSecurityMiddleware();
      this.configureParsingMiddleware();
      this.configureLoggingMiddleware();
      this.configureValidationMiddleware();
      this.configureRateLimiting();
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

  /**
   * Start the application server
   */
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

  /**
   * Graceful shutdown
   */
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
