// src/core/bootstrap/app.ts (UPDATE registerRoutes function)

import express, { Application, Router } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from '@core/config';
import { rateLimiter } from '@core/middleware/rate-limit.middleware';
import { errorHandler, notFoundHandler } from '@core/middleware/error.middleware';
import { requestLogger } from '@core/middleware/request-logger.middleware';
import { correlationId } from '@core/middleware/correlation-id.middleware';
import { Logger } from '@core/infrastructure/logger';
import { AuthContainer } from '@modules/auth/auth.container';

const logger = new Logger('App');

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);
  app.use(correlationId);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
    })
  );

  const corsOrigins = config.CORS_ORIGIN.split(',').map((origin) => origin.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || corsOrigins.includes(origin) || corsOrigins.includes('*')) {
          callback(null, true);
        } else {
          logger.warn('CORS request blocked', { origin });
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: config.CORS_CREDENTIALS,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
      exposedHeaders: ['X-Correlation-ID'],
      maxAge: 86400,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(requestLogger);
  app.use(rateLimiter);

  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      version: config.API_VERSION,
    });
  });

  app.get('/ready', async (req, res) => {
    try {
      const { Database } = await import('@core/infrastructure/database');
      const { RedisClient } = await import('@core/infrastructure/redis');

      const dbHealthy = await Database.testConnection();
      const redisHealthy = await RedisClient.isHealthy();

      if (dbHealthy && redisHealthy) {
        res.status(200).json({
          success: true,
          message: 'Service is ready',
          checks: {
            database: 'healthy',
            redis: 'healthy',
          },
        });
      } else {
        res.status(503).json({
          success: false,
          message: 'Service is not ready',
          checks: {
            database: dbHealthy ? 'healthy' : 'unhealthy',
            redis: redisHealthy ? 'healthy' : 'unhealthy',
          },
        });
      }
    } catch (error) {
      res.status(503).json({
        success: false,
        message: 'Service is not ready',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  logger.info('Application middleware configured');

  return app;
}

export function setupErrorHandling(app: Application): void {
  app.use(notFoundHandler);
  app.use(errorHandler);
  logger.info('Error handling configured');
}

export function registerRoutes(app: Application): void {
  const apiRouter = Router();

  // Version info
  apiRouter.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'API is running',
      version: config.API_VERSION,
      documentation: config.SWAGGER_ENABLED ? `/api/${config.API_VERSION}/docs` : null,
    });
  });

  // Initialize Auth Module
  AuthContainer.initialize();

  // Register module routes
  apiRouter.use('/auth', AuthContainer.getAuthRoutes());

  app.use(`/api/${config.API_VERSION}`, apiRouter);

  logger.info('Routes registered successfully', {
    modules: ['auth'],
  });
}

export function getApiRouter(): Router {
  return Router();
}
