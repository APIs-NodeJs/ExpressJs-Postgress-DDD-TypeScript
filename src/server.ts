import dotenv from "dotenv";

dotenv.config();

import { createApp } from "./app";
import { initializeDatabase, sequelize } from "@infrastructure/database/sequelize";
import { RedisClient } from "@infrastructure/cache/redis";
import { config } from "@config/env";
import { validateEnv } from "@config/validateEnv";
import logger from "@infrastructure/logging/logger";

async function startServer(): Promise<void> {
  try {
    // Validate environment variables
    validateEnv();

    logger.info("Starting DevCycle API Server...");

    // Initialize database
    await initializeDatabase();
    logger.info("✅ Database initialized");

    // Initialize Redis
    const redisReady = await RedisClient.ping();
    if (redisReady) {
      logger.info("✅ Redis connected");
    } else {
      logger.warn("⚠️  Redis not available - caching disabled");
    }

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.app.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           
║   🚀 ${config.app.name.padEnd(49)}                        
║                                                           
║      Environment: ${config.app.env.padEnd(42)}                
║      Port:        ${config.app.port.toString().padEnd(42)}   
║      Database:    ${config.database.name.padEnd(42)}         
║                                                           
║   🌐 API:      http://localhost:${config.app.port}${config.app.apiPrefix.padEnd(18)} 
║   📚 Docs:     http://localhost:${config.app.port}/api/docs${" ".repeat(17)} 
║   ❤️ Health:   http://localhost:${config.app.port}/health${" ".repeat(20)} 
║                                                           
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info("HTTP server closed");

        try {
          // Close database connections
          await sequelize.close();
          logger.info("Database connections closed");

          // Close Redis connection
          await RedisClient.disconnect();
          logger.info("Redis connection closed");

          logger.info("✅ Graceful shutdown completed");
          process.exit(0);
        } catch (error) {
          logger.error("Error during shutdown:", error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught errors
    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught Exception:", error);
      gracefulShutdown("UNCAUGHT_EXCEPTION");
    });

    process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
      logger.error("Unhandled Rejection at:", { promise, reason });
      gracefulShutdown("UNHANDLED_REJECTION");
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();