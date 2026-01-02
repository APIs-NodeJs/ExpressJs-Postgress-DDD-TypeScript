import { Application } from 'express';
import http from 'http';
import { config, isDevelopment } from '@core/config';
import { createApp, setupErrorHandling, registerRoutes } from '@core/bootstrap/app';
import { Database } from '@core/infrastructure/database';
import { RedisClient } from '@core/infrastructure/redis';
import { Logger } from '@core/infrastructure/logger';

const logger = new Logger('Server');

// ANSI color codes for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

class Server {
  private app: Application;
  private httpServer: http.Server | null = null;
  private isShuttingDown = false;
  private startTime: number = Date.now();

  constructor() {
    this.app = createApp();
  }

  private printBanner(): void {
    console.log(`\n${colors.cyan}${colors.bright}`);
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                               ║');
    console.log('║     🚀  ENTERPRISE NODE.JS API  🚀                           ║');
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log(`${colors.reset}\n`);
  }

  private printStatus(
    label: string,
    status: 'success' | 'warning' | 'error' | 'info',
    message?: string
  ): void {
    const icons = {
      success: '✓',
      warning: '⚠',
      error: '✗',
      info: 'ℹ',
    };

    const statusColors = {
      success: colors.green,
      warning: colors.yellow,
      error: colors.red,
      info: colors.blue,
    };

    const icon = icons[status];
    const color = statusColors[status];
    const msg = message ? ` ${colors.dim}(${message})${colors.reset}` : '';

    console.log(`${color}${colors.bright}  ${icon} ${label}${colors.reset}${msg}`);
  }

  private printSection(title: string): void {
    console.log(`\n${colors.cyan}${colors.bright}▶ ${title}${colors.reset}`);
    console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}`);
  }

  private printInfo(label: string, value: string, indent: boolean = true): void {
    const prefix = indent ? '    ' : '  ';
    console.log(
      `${prefix}${colors.dim}${label}:${colors.reset} ${colors.white}${value}${colors.reset}`
    );
  }

  async initialize(): Promise<void> {
    try {
      this.printBanner();
      this.printSection('INITIALIZATION');

      logger.info('Starting server initialization...');

      // Database connection
      this.printInfo('Database', 'Connecting...', false);
      await Database.connect();
      this.printStatus(
        'Database',
        'success',
        `${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`
      );

      // Redis connection
      this.printInfo('Redis', 'Connecting...', false);
      let redisConnected = false;
      try {
        await RedisClient.connect();
        redisConnected = true;
        this.printStatus('Redis', 'success', `${config.REDIS_HOST}:${config.REDIS_PORT}`);
      } catch (error) {
        if (isDevelopment) {
          this.printStatus('Redis', 'warning', 'Running without cache (dev mode)');
          logger.warn('Redis connection failed - continuing without cache in development');
        } else {
          this.printStatus('Redis', 'error', 'Connection failed');
          throw error;
        }
      }

      // Register routes
      this.printInfo('Routes', 'Registering...', false);
      registerRoutes(this.app);
      this.printStatus('Routes', 'success', 'All routes registered');

      // Error handling
      setupErrorHandling(this.app);
      this.printStatus('Error Handling', 'success', 'Middleware configured');

      console.log('');
      logger.info('✨ Server initialization completed successfully');
    } catch (error) {
      this.printStatus('Initialization', 'error', 'Failed to start server');
      logger.error('Server initialization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  start(): void {
    this.httpServer = this.app.listen(config.PORT, () => {
      const bootTime = Date.now() - this.startTime;

      this.printSection('SERVER READY');

      console.log(
        `\n${colors.bgGreen}${colors.bright}                                                            ${colors.reset}`
      );
      console.log(
        `${colors.bgGreen}${colors.bright}  🎉  SERVER IS UP AND RUNNING!                              ${colors.reset}`
      );
      console.log(
        `${colors.bgGreen}${colors.bright}                                                            ${colors.reset}\n`
      );

      // Environment info
      this.printInfo('Environment', config.NODE_ENV.toUpperCase());
      this.printInfo('Version', config.API_VERSION);
      this.printInfo('Port', config.PORT.toString());
      this.printInfo('Boot Time', `${bootTime}ms`);
      this.printInfo('Process ID', process.pid.toString());

      // Available endpoints
      this.printSection('AVAILABLE ENDPOINTS');

      const endpoints = [
        { method: 'GET', path: '/health', desc: 'Health check' },
        { method: 'GET', path: '/ready', desc: 'Readiness probe' },
        { method: 'GET', path: `/api/${config.API_VERSION}`, desc: 'API info' },
      ];

      if (config.SWAGGER_ENABLED) {
        endpoints.push({
          method: 'GET',
          path: `/api/${config.API_VERSION}/docs`,
          desc: 'API documentation',
        });
      }

      endpoints.forEach(({ method, path, desc }) => {
        const url = `http://localhost:${config.PORT}${path}`;
        console.log(
          `  ${colors.bright}${colors.cyan}${method.padEnd(6)}${colors.reset} ${colors.white}${url}${colors.reset}`
        );
        console.log(`         ${colors.dim}${desc}${colors.reset}`);
      });

      // Status indicators
      this.printSection('STATUS');
      this.printInfo(
        'Database',
        Database.isConnectionEstablished() ? '🟢 Connected' : '🔴 Disconnected'
      );
      this.printInfo(
        'Redis',
        RedisClient.isConnectionEstablished() ? '🟢 Connected' : '🟡 Optional (disabled)'
      );
      this.printInfo('CORS', config.CORS_CREDENTIALS ? '🟢 Enabled' : '🔴 Disabled');
      this.printInfo(
        'Rate Limiting',
        `🟢 ${config.RATE_LIMIT_MAX_REQUESTS} req/${config.RATE_LIMIT_WINDOW_MS}ms`
      );

      // Tips
      console.log(`\n${colors.dim}${'─'.repeat(60)}${colors.reset}`);
      console.log(`  ${colors.yellow}💡 Tips:${colors.reset}`);
      console.log(`     • Press ${colors.bright}Ctrl+C${colors.reset} to stop the server`);
      console.log(`     • Check ${colors.bright}/health${colors.reset} endpoint for quick status`);
      console.log(
        `     • View logs in ${colors.bright}logs/${colors.reset} directory (production)`
      );
      console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}\n`);

      logger.info('🚀 Server is listening for connections');
    });

    // Set server timeouts
    this.httpServer.keepAliveTimeout = 65000;
    this.httpServer.headersTimeout = 66000;

    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string): Promise<void> => {
      if (this.isShuttingDown) {
        logger.warn('Shutdown already in progress, ignoring signal', { signal });
        return;
      }

      this.isShuttingDown = true;

      console.log(`\n${colors.yellow}${colors.bright}`);
      console.log('╔═══════════════════════════════════════════════════════════════╗');
      console.log('║  ⚠️  GRACEFUL SHUTDOWN INITIATED                              ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝');
      console.log(`${colors.reset}`);

      logger.info(`${signal} received, starting graceful shutdown`);

      if (this.httpServer) {
        this.httpServer.close(async () => {
          this.printStatus('HTTP Server', 'success', 'Closed');

          try {
            // Close Redis connection (if connected)
            if (RedisClient.isConnectionEstablished()) {
              await RedisClient.disconnect();
              this.printStatus('Redis', 'success', 'Disconnected');
            }

            // Close database connection
            await Database.disconnect();
            this.printStatus('Database', 'success', 'Disconnected');

            console.log(
              `\n${colors.green}${colors.bright}✓ Graceful shutdown completed${colors.reset}\n`
            );
            logger.info('Graceful shutdown completed successfully');
            process.exit(0);
          } catch (error) {
            this.printStatus('Shutdown', 'error', 'Error during cleanup');
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
        console.log(
          `\n${colors.red}${colors.bright}✗ Graceful shutdown timeout - forcing exit${colors.reset}\n`
        );
        logger.error('Graceful shutdown timeout exceeded, forcing exit');
        process.exit(1);
      }, 10000);
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.log(`\n${colors.red}${colors.bright}✗ UNCAUGHT EXCEPTION${colors.reset}\n`);
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
      });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      console.log(`\n${colors.red}${colors.bright}✗ UNHANDLED REJECTION${colors.reset}\n`);
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
    console.log(`\n${colors.red}${colors.bright}✗ BOOTSTRAP FAILED${colors.reset}\n`);
    logger.error('Failed to bootstrap server', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
}

// Start the server
bootstrap();
