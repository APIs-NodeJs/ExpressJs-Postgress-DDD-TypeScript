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
  private isShuttingDown = false;

  constructor() {
    this.app = createApp();
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Starting server initialization...');

      // Connect to database
      await Database.connect();
      logger.info('✓ Database connected');

      // Connect to Redis
      await RedisClient.connect();
      logger.info('✓ Redis connected');

      // Register application routes
      registerRoutes(this.app);
      logger.info('✓ Routes registered');

      // Setup error handling (must be last)
      setupErrorHandling(this.app);
      logger.info('✓ Error handling configured');

      logger.info('Server initialization completed successfully');
    } catch (error) {
      logger.error('Server initialization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  start(): void {
    this.httpServer = this.app.listen(config.PORT, () => {
      logger.info('╔════════════════════════════════════════════════════╗');
      logger.info(`║  Server running on port ${config.PORT} in ${config.NODE_ENV} mode    ║`);
      logger.info('╠════════════════════════════════════════════════════╣');
      logger.info(`║  Health:  http://localhost:${config.PORT}/health           ║`);
      logger.info(
        `║  API:     http://localhost:${config.PORT}/api/${config.API_VERSION}         ║`
      );
      logger.info('╚════════════════════════════════════════════════════╝');
    });

    // Set server timeouts
    this.httpServer.keepAliveTimeout = 65000; // 65 seconds
    this.httpServer.headersTimeout = 66000; // 66 seconds

    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string): Promise<void> => {
      if (this.isShuttingDown) {
        logger.warn('Shutdown already in progress, ignoring signal', { signal });
        return;
      }

      this.isShuttingDown = true;
      logger.info(`${signal} received, starting graceful shutdown`);

      // Stop accepting new connections
      if (this.httpServer) {
        this.httpServer.close(async () => {
          logger.info('✓ HTTP server closed');

          try {
            // Close Redis connection
            await RedisClient.disconnect();
            logger.info('✓ Redis disconnected');

            // Close database connection
            await Database.disconnect();
            logger.info('✓ Database disconnected');

            logger.info('Graceful shutdown completed successfully');
            process.exit(0);
          } catch (error) {
            logger.error('Error during graceful shutdown', {
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            process.exit(1);
          }
        });
      } else {
        process.exit(0);
      }

      // Force shutdown after timeout
      setTimeout(() => {
        logger.error('Graceful shutdown timeout exceeded, forcing exit');
        process.exit(1);
      }, 10000);
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
      });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
      });
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
    logger.error('Failed to bootstrap server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

// Start the server
bootstrap();
