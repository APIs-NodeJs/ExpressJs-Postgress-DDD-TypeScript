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
import { UserContainer } from '@modules/user/user.container';
import { WorkspaceContainer } from '@modules/workspace/workspace.container';

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
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Workspace-ID'],
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

  // Initialize modules
  AuthContainer.initialize();
  UserContainer.initialize();
  WorkspaceContainer.initialize();

  // Register module routes
  apiRouter.use('/auth', AuthContainer.getAuthRoutes());
  apiRouter.use('/users', UserContainer.getUserRoutes());
  apiRouter.use('/workspaces', WorkspaceContainer.getWorkspaceRoutes());

  app.use(`/api/${config.API_VERSION}`, apiRouter);

  logger.info('Routes registered successfully', {
    modules: ['auth', 'user', 'workspace'],
  });
}

export function getApiRouter(): Router {
  return Router();
}

// src/core/infrastructure/database.ts (UPDATE to include workspace models)

import { Sequelize, SequelizeOptions } from 'sequelize-typescript';
import { config } from '@core/config';
import { Logger } from './logger';
import { UserModel } from '@modules/auth/infrastructure/models/user.model';
import { SessionModel } from '@modules/auth/infrastructure/models/session.model';
import { WorkspaceModel } from '@modules/workspace/infrastructure/models/workspace.model';
import { WorkspaceMemberModel } from '@modules/workspace/infrastructure/models/workspace-member.model';
import { WorkspaceInvitationModel } from '@modules/workspace/infrastructure/models/workspace-invitation.model';

const logger = new Logger('Database');

export class Database {
  private static instance: Sequelize | null = null;
  private static isConnected = false;

  static getInstance(): Sequelize {
    if (!Database.instance) {
      const sequelizeConfig: SequelizeOptions = {
        dialect: 'postgres',
        host: config.DB_HOST,
        port: config.DB_PORT,
        username: config.DB_USER,
        password: config.DB_PASSWORD,
        database: config.DB_NAME,
        models: [
          UserModel,
          SessionModel,
          WorkspaceModel,
          WorkspaceMemberModel,
          WorkspaceInvitationModel,
        ],
        pool: {
          max: config.DB_POOL_MAX,
          min: config.DB_POOL_MIN,
          idle: config.DB_POOL_IDLE,
          acquire: 60000,
          evict: 1000,
        },
        logging: config.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true,
          paranoid: true,
        },
        dialectOptions: {
          ssl:
            config.NODE_ENV === 'production'
              ? {
                  require: true,
                  rejectUnauthorized: false,
                }
              : false,
        },
        retry: {
          max: 3,
          match: [
            /SequelizeConnectionError/,
            /SequelizeConnectionRefusedError/,
            /SequelizeHostNotFoundError/,
            /SequelizeHostNotReachableError/,
            /SequelizeInvalidConnectionError/,
            /SequelizeConnectionTimedOutError/,
          ],
        },
      };

      Database.instance = new Sequelize(sequelizeConfig);
    }

    return Database.instance;
  }

  static async connect(): Promise<void> {
    if (Database.isConnected) {
      logger.info('Database already connected');
      return;
    }

    try {
      const sequelize = Database.getInstance();
      await sequelize.authenticate();
      Database.isConnected = true;
      logger.info('Database connection established successfully', {
        host: config.DB_HOST,
        database: config.DB_NAME,
      });

      // Sync models only in development
      if (config.NODE_ENV === 'development') {
        await sequelize.sync({ alter: false });
        logger.info('Database models synchronized');
      }
    } catch (error) {
      Database.isConnected = false;
      logger.error('Unable to connect to the database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        host: config.DB_HOST,
        database: config.DB_NAME,
      });
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (!Database.isConnected || !Database.instance) {
      logger.info('Database not connected, skipping disconnect');
      return;
    }

    try {
      await Database.instance.close();
      Database.isConnected = false;
      Database.instance = null;
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const sequelize = Database.getInstance();
      await sequelize.authenticate();
      return true;
    } catch (error) {
      logger.error('Database connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  static isConnectionEstablished(): boolean {
    return Database.isConnected;
  }

  static async transaction<T>(callback: (transaction: any) => Promise<T>): Promise<T> {
    const sequelize = Database.getInstance();
    return sequelize.transaction(callback);
  }
}
