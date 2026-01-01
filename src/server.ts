import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './core/bootstrap/app';
import { connectDatabase } from './core/config/database';
import { redis } from './core/config/redis';
import { logger, logStartup, logServerListening } from './core/config/logger';

const PORT = parseInt(process.env.PORT || '3000', 10);

const startServer = async (): Promise<void> => {
  try {
    logStartup();

    // Connect to database
    await connectDatabase();

    // Test Redis connection
    await redis.ping();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(PORT, () => {
      logServerListening(PORT);
    });

    // Keep process alive
    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing server');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

startServer();
