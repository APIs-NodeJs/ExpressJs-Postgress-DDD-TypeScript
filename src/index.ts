// src/index.ts
import { App } from "./app";
import { config } from "./config/env.config";
import { sequelize } from "./config/database";
import { logger } from "./shared/utils/logger";

const app = new App();
const PORT = config.PORT;

let server: any;

async function startServer() {
  try {
    await app.initialize();
    server = app.app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, starting graceful shutdown`);

  if (server) {
    server.close(async () => {
      logger.info("HTTP server closed");

      try {
        await sequelize.close();
        logger.info("Database connection closed");

        // Close other connections
        process.exit(0);
      } catch (error) {
        logger.error("Error during shutdown:", error);
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 30000);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();
