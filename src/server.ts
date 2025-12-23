import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";
import { initializeDatabase } from "@infrastructure/database/sequelize";
import { config } from "@config/env";

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.app.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 ${config.app.name.padEnd(49)} ║
║                                                           ║
║   Environment: ${config.app.env.padEnd(42)} ║
║   Port:        ${config.app.port.toString().padEnd(42)} ║
║   Database:    ${config.database.name.padEnd(42)} ║
║                                                           ║
║   API Docs:    http://localhost:${
        config.app.port
      }${config.app.apiPrefix.padEnd(18)} ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        console.log("HTTP server closed");

        try {
          // Close database connections
          await require("@infrastructure/database/sequelize").sequelize.close();
          console.log("Database connections closed");

          process.exit(0);
        } catch (error) {
          console.error("Error during shutdown:", error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error(
          "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
