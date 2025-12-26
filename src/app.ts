import express, { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import { initializeDatabase } from "./config/database";
import { setupEventHandlers } from "./config/events";
import { AuthModule } from "./modules/auth/AuthModule";

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.configureMiddlewares();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private configureRoutes(): void {
    const authModule = AuthModule.getInstance();

    this.app.use("/api/auth", authModule.router);

    this.app.get("/health", (req: Request, res: Response) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
  }

  private configureErrorHandling(): void {
    this.app.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error("[Error]", err);

        res.status(500).json({
          success: false,
          error:
            process.env.NODE_ENV === "development"
              ? err.message
              : "Internal server error",
        });
      }
    );

    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: "Route not found",
      });
    });
  }

  public async start(port: number = 3000): Promise<void> {
    try {
      await initializeDatabase();
      setupEventHandlers();

      this.app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
        console.log(`📚 API Documentation: http://localhost:${port}/health`);
      });
    } catch (error) {
      console.error("❌ Failed to start application:", error);
      process.exit(1);
    }
  }
}
