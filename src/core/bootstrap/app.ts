import express, { Application } from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import { errorHandler, notFoundHandler } from '@core/middleware/errorHandler';
import { requestLogger } from '@core/middleware/requestLogger';
import { rateLimiter } from '@core/middleware/rateLimiter';
import { corsConfig } from '@core/middleware/cors';

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors(corsConfig));
  app.use(mongoSanitize());
  app.use(xss());
  app.use(hpp());

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression());

  // Request logging
  app.use(requestLogger);

  // Rate limiting
  if (process.env.ENABLE_RATE_LIMIT === 'true') {
    app.use(rateLimiter);
  }

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API routes will be registered here
  // app.use('/api/v1', routes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
};