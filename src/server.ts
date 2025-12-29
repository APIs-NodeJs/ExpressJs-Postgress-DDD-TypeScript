// src/server.ts
import http from 'http';
import { App } from './app';
import { config } from './shared/config/env.config';
import { initializeDatabase, closeDatabase } from './shared/config/database.config';
import { SocketServer } from './shared/infrastructure/socket/SocketServer';
import { setupSocketGateways } from './shared/infrastructure/socket/setupGateways';

const PORT = config.PORT;

async function startServer() {
  try {
    await initializeDatabase();

    const application = new App();
    const httpServer = http.createServer(application.app);

    // Initialize Socket.IO
    const socketServer = new SocketServer(httpServer);
    setupSocketGateways(socketServer);

    const server = httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 Health check: http://localhost:${PORT}/api/v1/health`);
      console.log(`🔌 WebSocket server initialized`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`${signal} received, starting graceful shutdown`);

      server.close(async () => {
        console.log('HTTP server closed');

        try {
          await socketServer.close();
          console.log('Socket.IO server closed');

          await closeDatabase();
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
