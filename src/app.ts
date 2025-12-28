import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { config } from './shared/config/env.config';
import { errorHandler } from './shared/middlewares/errorHandler';
import { requestLogger } from './shared/middlewares/requestLogger';
import { createRateLimiter } from './shared/middlewares/rateLimiter';
import { apiRouter } from './api/v1';

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.ALLOWED_ORIGINS.split(','),
      credentials: true,
    }));

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    this.app.use(compression());

    this.app.use(requestLogger());

    this.app.use(createRateLimiter({ windowMs: 60 * 1000, max: 200 }));
  }

  private setupRoutes(): void {
    this.app.use('/api/v1', apiRouter);

    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
          path: req.path,
        },
        timestamp: new Date().toISOString(),
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }
}
