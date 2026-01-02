import { Application } from 'express';
import http from 'http';
import { config } from '@core/config';
import { createApp, setupErrorHandling, registerRoutes } from '@core/bootstrap/app';
import { Database } from '@core/infrastructure/database';
import { RedisClient } from '@core/infrastructure/redis';
import { Logger } from '@core/infrastructure/logger';

const logger = new Logger('Server');

class Server {
  private app: Application;
  private httpServer: http.Server | null = null;

  constructor() {
    this.app = createApp();
  }

  async initialize(): Promise<void> {
    try {
      await Database.connect();

      await RedisClient.connect();

      registerRoutes(this.app);

      setupErrorHandling(this.app);

      logger.info('Server initialized successfully');
    } catch (error) {
      logger.error('Server initialization failed', { error });
      throw error;
    }
  }

  start(): void {
    this.httpServer = this.app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
      logger.info(`Health check: http://localhost:${config.PORT}/health`);
    });

    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received, starting graceful shutdown`);

      if (this.httpServer) {
        this.httpServer.close(async () => {
          logger.info('HTTP server closed');

          try {
            await RedisClient.disconnect();
            await Database.disconnect();
            logger.info('All connections closed successfully');
            process.exit(0);
          } catch (error) {
            logger.error('Error during graceful shutdown', { error });
            process.exit(1);
          }
        });
      }

      setTimeout(() => {
        logger.error('Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', { reason });
      gracefulShutdown('unhandledRejection');
    });
  }
}

async function bootstrap(): Promise<void> {
  try {
    const server = new Server();
    await server.initialize();
    server.start();
  } catch (error) {
    logger.error('Failed to bootstrap server', { error });
    process.exit(1);
  }
}

bootstrap();
