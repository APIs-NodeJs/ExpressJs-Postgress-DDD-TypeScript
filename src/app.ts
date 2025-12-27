import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import { initializeDatabase } from "./config/database";
import { setupEventHandlers } from "./config/events";
import { AuthModule } from "./modules/auth/AuthModule";
import { errorHandler } from "./shared/middlewares/errorHandler";
import { AdvancedRequestLogger } from "./shared/middlewares/advancedLogger";
import { cacheService } from "./shared/infrastructure/cache/CacheService";
import { logger } from "./shared/utils/AdvancedLogger";
import { HealthController } from "./shared/controllers/HealthController";
import { createRateLimiter } from "./shared/middlewares/rateLimiter";

export class App {
  public app: Application;
  private healthController: HealthController;

  constructor() {
    this.app = express();
    this.healthController = new HealthController();
  }

  private configureMiddlewares(): void {
    // ============================================
    // LAYER 1: SECURITY & INFRASTRUCTURE
    // ============================================

    // Trust proxy (important for rate limiting & IP detection)
    this.app.set("trust proxy", 1);

    // Security headers (should be first)
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
        maxAge: 86400, // 24 hours
      })
    );

    // ============================================
    // LAYER 2: REQUEST PARSING
    // ============================================

    // Body parsing with size limits
    this.app.use(
      express.json({
        limit: "10mb",
        // Prevent prototype pollution
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

    // ============================================
    // LAYER 3: LOGGING & MONITORING
    // ============================================

    // Request ID & correlation
    this.app.use(AdvancedRequestLogger.correlationId());

    // Main request/response logger
    this.app.use(AdvancedRequestLogger.middleware());

    // Performance monitoring (1s slow, 5s critical)
    this.app.use(
      AdvancedRequestLogger.performanceMonitor({
        slow: 1000,
        critical: 5000,
      })
    );

    // User activity tracking
    this.app.use(AdvancedRequestLogger.activityTracker());

    // API metrics collection
    this.app.use(AdvancedRequestLogger.metricsCollector());

    // ============================================
    // LAYER 4: GLOBAL RATE LIMITING
    // ============================================

    // Global rate limiter (applies to all routes)
    const globalRateLimiter = createRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      max: 200, // 200 requests per minute
      message: "Too many requests from this IP",
    });
    this.app.use(globalRateLimiter);
  }

  private configureRoutes(): void {
    // ============================================
    // HEALTH CHECK ROUTES (No auth required)
    // ============================================
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

    // ============================================
    // API ROUTES
    // ============================================
    const authModule = AuthModule.getInstance();
    this.app.use("/api/auth", authModule.router);

    // ============================================
    // 404 HANDLER (Must be before error handler)
    // ============================================
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
    // ============================================
    // ERROR TRACKING MIDDLEWARE
    // ============================================
    this.app.use(AdvancedRequestLogger.errorTracker());

    // ============================================
    // GLOBAL ERROR HANDLER (Must be last)
    // ============================================
    this.app.use(errorHandler);
  }

  public async initialize(): Promise<void> {
    try {
      logger.info("🚀 Initializing application...");

      // Initialize database with connection pooling
      await initializeDatabase();

      // Initialize cache with circuit breaker
      await cacheService.connect();

      // Setup domain event handlers
      setupEventHandlers();

      // Configure middleware (order matters!)
      this.configureMiddlewares();

      // Configure routes
      this.configureRoutes();

      // Configure error handling (must be last)
      this.configureErrorHandling();

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
}
