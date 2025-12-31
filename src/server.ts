// src/server.ts
import http from 'http';
import { App } from './app';
import { config } from './shared/config/env.config';
import { initializeDatabase, closeDatabase } from './shared/config/database.config';
import { SocketServer } from './shared/infrastructure/socket/SocketServer';
import { setupSocketGateways } from './shared/infrastructure/socket/setupGateways';
import { ConfigValidator } from './shared/config/ConfigValidator';
import { outboxWorker } from './core/infrastructure/outbox/OutboxWorker';
import { Logger } from './core/utils/Logger';

const PORT = config.PORT;
const logger = new Logger('Server');

// Global error handlers - MUST be set before anything else
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString(),
  });

  // In production, exit gracefully to allow process manager to restart
  if (config.NODE_ENV === 'production') {
    logger.error('Shutting down due to unhandled rejection');
    gracefulShutdown('UNHANDLED_REJECTION', 1);
  }
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });

  // Always exit on uncaught exceptions
  logger.error('Shutting down due to uncaught exception');
  gracefulShutdown('UNCAUGHT_EXCEPTION', 1);
});

// Graceful shutdown function
async function gracefulShutdown(signal: string, exitCode: number = 0): Promise<void> {
  logger.info(`${signal} received, starting graceful shutdown`);

  try {
    // Stop accepting new connections
    if (server) {
      await new Promise<void>(resolve => {
        server.close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      });
    }

    // Stop outbox worker
    if (outboxWorker) {
      outboxWorker.stop();
      logger.info('Outbox worker stopped');
    }

    // Close Socket.IO
    if (socketServer) {
      await socketServer.close();
      logger.info('Socket.IO server closed');
    }

    // Close database
    await closeDatabase();

    logger.info('✅ Graceful shutdown completed');
    process.exit(exitCode);
  } catch (error) {
    logger.error('Error during shutdown', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

let server: http.Server;
let socketServer: SocketServer;

async function startServer() {
  try {
    // 1. Validate configuration FIRST
    logger.info('Validating configuration...');
    ConfigValidator.validate();

    // 2. Initialize database
    logger.info('Initializing database...');
    await initializeDatabase();

    // 3. Create application
    const application = new App();
    const httpServer = http.createServer(application.app);
    server = httpServer;

    // 4. Initialize Socket.IO
    logger.info('Initializing Socket.IO...');
    socketServer = new SocketServer(httpServer);
    setupSocketGateways(socketServer);

    // 5. Start outbox worker
    logger.info('Starting outbox worker...');
    outboxWorker.start();

    // 6. Start HTTP server
    await new Promise<void>(resolve => {
      server.listen(PORT, () => {
        logger.info('🚀 Server started successfully', {
          port: PORT,
          environment: config.NODE_ENV,
          healthCheck: `http://localhost:${PORT}/api/v1/health`,
        });
        resolve();
      });
    });

    // 7. Setup shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM', 0));
    process.on('SIGINT', () => gracefulShutdown('SIGINT', 0));

    // 8. Set shutdown timeout (force exit after 30 seconds)
    const shutdownTimeout = setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);

    // Don't prevent graceful shutdown
    shutdownTimeout.unref();

    logger.info('✅ Server initialization complete');
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Start the server
startServer();
