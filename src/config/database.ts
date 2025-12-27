// src/config/database.ts - FIXED VERSION
import { Sequelize, Options } from "sequelize";
import { config } from "./env.config";
import { logger } from "../shared/utils/logger"; // ✅ FIXED: Correct import path
import { ConnectionPoolManager } from "../shared/infrastructure/database/ConnectionPoolManager";

// Connection pool configuration based on environment
const getPoolConfig = () => {
  const isProd = config.NODE_ENV === "production";
  const isTest = config.NODE_ENV === "test";

  return {
    max: isProd ? 20 : isTest ? 2 : 5,
    min: isProd ? 5 : 0,
    acquire: 60000,
    idle: isTest ? 1000 : 10000,
    evict: 1000,
  };
};

// Database configuration
const sequelizeConfig: Options = {
  dialect: "postgres",
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  username: config.DB_USER,
  password: config.DB_PASSWORD,
  pool: getPoolConfig(),

  // Logging with performance tracking
  logging: (msg) => {
    if (config.NODE_ENV === "development") {
      logger.debug(msg);
    } else if (config.NODE_ENV === "production") {
      const match = msg.match(/Executed \(.*?: (\d+)ms\)/);
      if (match && parseInt(match[1]) > 1000) {
        logger.warn("Slow query detected", {
          query: msg.substring(0, 200),
          duration: `${match[1]}ms`,
        });
      }
    }
  },

  benchmark: config.NODE_ENV === "development",
  logQueryParameters: config.NODE_ENV === "development",
  timezone: "+00:00",

  retry: {
    max: 3,
    timeout: 3000,
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
      /TimeoutError/,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
    ],
  },

  dialectOptions: {
    statement_timeout: 30000,
    idle_in_transaction_session_timeout: 60000,
  },

  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    paranoid: false,
  },
};

export const sequelize = new Sequelize(sequelizeConfig);

// Connection pool manager instance
let poolManager: ConnectionPoolManager | null = null;

// Connection state tracking
let isConnected = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;

export async function initializeDatabase(): Promise<void> {
  try {
    connectionAttempts++;

    logger.info("Attempting database connection...", {
      host: config.DB_HOST,
      database: config.DB_NAME,
      attempt: connectionAttempts,
    });

    // Test the connection
    await sequelize.authenticate();

    isConnected = true;
    connectionAttempts = 0;

    logger.info("✅ Database connection established", {
      host: config.DB_HOST,
      database: config.DB_NAME,
      pool: getPoolConfig(),
    });

    // Initialize connection pool manager
    poolManager = new ConnectionPoolManager(sequelize);
    poolManager.startMonitoring();

    // Set up event listeners for pool monitoring
    setupPoolEventListeners();

    // Sync models in development
    if (config.NODE_ENV === "development") {
      logger.info("Synchronizing database models...");
      await sequelize.sync({ alter: true });
      logger.info("✅ Database models synchronized");
    }

    if (config.NODE_ENV === "production") {
      logger.info("⚠️  Remember to run migrations: npm run migration:run");
    }
  } catch (error) {
    isConnected = false;

    logger.error("❌ Unable to connect to database", {
      error: error instanceof Error ? error.message : "Unknown error",
      host: config.DB_HOST,
      database: config.DB_NAME,
      attempt: connectionAttempts,
    });

    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      const retryDelay = Math.min(connectionAttempts * 2000, 10000);
      logger.info(`Retrying database connection in ${retryDelay}ms...`);

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return initializeDatabase();
    }

    throw error;
  }
}

function setupPoolEventListeners(): void {
  if (!poolManager) return;

  // High usage warning
  poolManager.on("high-usage", ({ usagePercent, metrics }) => {
    logger.warn("⚠️  High database connection pool usage", {
      usage: `${usagePercent.toFixed(1)}%`,
      using: metrics.using,
      size: metrics.size,
      waiting: metrics.waiting,
    });
  });

  // Pool exhaustion
  poolManager.on("pool-exhausted", (metrics) => {
    logger.error("🚨 Database connection pool exhausted", {
      waiting: metrics.waiting,
      using: metrics.using,
      size: metrics.size,
      recommendation: "Consider increasing pool size or optimizing queries",
    });
  });

  // High latency
  poolManager.on("high-latency", ({ latency }) => {
    logger.warn("⏱️  High database latency detected", {
      latency: `${latency}ms`,
      threshold: "1000ms",
    });
  });

  // Unhealthy status
  poolManager.on("unhealthy", ({ failures }) => {
    logger.error("💀 Database marked as unhealthy", {
      consecutiveFailures: failures,
      action: "Check database server status",
    });
  });
}

export async function closeDatabase(): Promise<void> {
  if (!isConnected) return;

  try {
    logger.info("Closing database connection...");

    // Stop pool monitoring
    if (poolManager) {
      poolManager.stopMonitoring();
    }

    await sequelize.close();
    isConnected = false;

    logger.info("✅ Database connection closed");
  } catch (error) {
    logger.error("Error closing database connection", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  details: any;
}> {
  try {
    await sequelize.authenticate();

    const poolStats = poolManager ? poolManager.getStatistics() : null;

    return {
      healthy: true,
      details: {
        connected: isConnected,
        host: config.DB_HOST,
        database: config.DB_NAME,
        poolStats,
      },
    };
  } catch (error) {
    return {
      healthy: false,
      details: {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

export function isConnectedToDatabase(): boolean {
  return isConnected;
}

export async function retryConnection(): Promise<boolean> {
  if (isConnected) return true;

  try {
    await sequelize.authenticate();
    isConnected = true;
    logger.info("✅ Database reconnected successfully");
    return true;
  } catch (error) {
    logger.error("Failed to reconnect to database", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

// Export pool manager for advanced monitoring
export function getPoolManager(): ConnectionPoolManager | null {
  return poolManager;
}
