import express, { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import { initializeDatabase } from "./config/database";
import { setupEventHandlers } from "./config/events";
import { AuthModule } from "./modules/auth/AuthModule";
import { errorHandler } from "./shared/middlewares/errorHandler";
import { requestLogger } from "./shared/middlewares/requestLogger";
import { cacheService } from "./shared/infrastructure/cache/CacheService";
import { logger } from "./shared/utils/logger";

export class App {
  public app: Application;

  constructor() {
    this.app = express();
  }

  private configureMiddlewares(): void {
    // Security
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
      })
    );

    // Request parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Logging
    this.app.use(requestLogger);

    // Trust proxy
    this.app.set("trust proxy", 1);
  }

  private configureRoutes(): void {
    const authModule = AuthModule.getInstance();

    // API routes
    this.app.use("/api/auth", authModule.router);

    // Health checks
    this.app.get("/health", (_req: Request, res: Response) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Route not found",
        },
      });
    });
  }

  private configureErrorHandling(): void {
    // Global error handler (must be last)
    this.app.use(errorHandler);
  }

  public async initialize(): Promise<void> {
    try {
      // Initialize database
      await initializeDatabase();

      // Initialize cache
      await cacheService.connect();

      // Setup event handlers
      setupEventHandlers();

      // Configure app
      this.configureMiddlewares();
      this.configureRoutes();
      this.configureErrorHandling();

      logger.info("✅ Application initialized successfully");
    } catch (error) {
      logger.error("❌ Failed to initialize application:", error);
      throw error;
    }
  }

  public async start(port: number = 3000): Promise<void> {
    try {
      await this.initialize();

      this.app.listen(port, () => {
        logger.info(`🚀 Server running on port ${port}`);
        logger.info(`📚 Environment: ${process.env.NODE_ENV}`);
        logger.info(`🔗 Health check: http://localhost:${port}/health`);
      });
    } catch (error) {
      logger.error("❌ Failed to start application:", error);
      process.exit(1);
    }
  }
}
