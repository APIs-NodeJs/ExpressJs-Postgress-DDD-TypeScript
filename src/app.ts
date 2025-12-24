import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { routes } from './infrastructure/http/routes';
import { errorHandler } from './infrastructure/http/middlewares/errorHandler';
import { requestId } from './infrastructure/http/middlewares/requestId';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.ALLOWED_ORIGINS, credentials: true }));
  
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
  });
  app.use(limiter);

  app.use(express.json({ limit: '10mb' }));
  app.use(requestId);
  app.use(routes);
  app.use(errorHandler);

  return app;
}
