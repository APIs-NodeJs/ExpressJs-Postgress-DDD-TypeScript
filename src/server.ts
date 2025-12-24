import "reflect-metadata"; // ✅ ADDED: Must be first import
import { createApp } from "./app";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { setupContainer } from "./infrastructure/di/container"; // ✅ ADDED

async function startServer(): Promise<void> {
  try {
    // ✅ Setup DI container BEFORE everything else
    setupContainer();

    await connectDatabase();
    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║   🚀🚀 Server Started Successfully                    ║
║   Port: ${env.PORT}                                    ║
║   Health: http://localhost:${env.PORT}/health          ║
╚════════════════════════════════════════════════════════╝
      `);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down...`);
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
