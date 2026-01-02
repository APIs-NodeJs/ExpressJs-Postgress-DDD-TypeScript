import express, { Application, Router } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from '@core/config';
import { rateLimiter } from '@core/middleware/rate-limit.middleware';
import { errorHandler, notFoundHandler } from '@core/middleware/error.middleware';
import { Logger } from '@core/infrastructure/logger';

const logger = new Logger('App');

export function createApp(): Application {
  const app = express();

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
    })
  );

  const corsOrigins = config.CORS_ORIGIN.split(',').map((origin) => origin.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || corsOrigins.includes(origin) || corsOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: config.CORS_CREDENTIALS,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use(rateLimiter);

  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
    });
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
  const apiRouter = express.Router();

  // Import auth container dynamically to avoid circular dependencies
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AuthContainer } = require('@modules/auth/auth.container');
  AuthContainer.initialize();

  apiRouter.use('/auth', AuthContainer.getRoutes());

  app.use(`/api/${config.API_VERSION}`, apiRouter);

  logger.info('Routes registered successfully');
}
