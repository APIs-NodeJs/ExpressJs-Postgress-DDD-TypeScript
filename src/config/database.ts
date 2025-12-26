import { Sequelize, Options } from "sequelize";
import { config } from "./env.config";
import { logger } from "../shared/utils/logger";

// Connection pool configuration based on environment
const getPoolConfig = () => {
  const isProd = config.NODE_ENV === "production";
  const isTest = config.NODE_ENV === "test";

  return {
    max: isProd ? 20 : isTest ? 2 : 5,
    min: isProd ? 5 : 0,
    acquire: 60000, // Maximum time (ms) to get connection before throwing error
    idle: isTest ? 1000 : 10000, // Maximum time (ms) connection can be idle before released
    evict: 1000, // Time interval (ms) to run eviction to remove idle connections
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

  // Connection pooling
  pool: getPoolConfig(),

  // Logging
  logging: (msg) => {
    if (config.NODE_ENV === "development") {
      logger.debug(msg);
    } else if (config.NODE_ENV === "production") {
      // Only log slow queries in production
      if (msg.includes("Executed") && msg.includes("ms")) {
        const match = msg.match(/Executed \(.*?: (\d+)ms\)/);
        if (match && parseInt(match[1]) > 1000) {
          // Log queries taking more than 1 second
          logger.warn("Slow query detected", { query: msg });
        }
      }
    }
    // No logging in test environment
  },

  // Performance
  benchmark: config.NODE_ENV === "development",
  logQueryParameters: config.NODE_ENV === "development",

  // Timezone
  timezone: "+00:00",

  // Retry logic for transient failures
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

  // Statement timeout (30 seconds)
  dialectOptions: {
    statement_timeout: 30000,
    idle_in_transaction_session_timeout: 60000,
  },

  // Define options for models
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    paranoid: false, // Set to true if you want soft deletes globally
  },
};

export const sequelize = new Sequelize(sequelizeConfig);

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

    // Sync models in development (with safety check)
    if (config.NODE_ENV === "development") {
      logger.info("Synchronizing database models...");

      // Use alter instead of force to prevent data loss
      await sequelize.sync({ alter: true });

      logger.info("✅ Database models synchronized");
    }

    // Run migrations check in production
    if (config.NODE_ENV === "production") {
      logger.info("⚠️  Remember to run migrations: npm run migration:run");
    }

    // Set up connection event handlers
    setupConnectionHandlers();
  } catch (error) {
    isConnected = false;

    logger.error("❌ Unable to connect to database", {
      error: error instanceof Error ? error.message : "Unknown error",
      host: config.DB_HOST,
      database: config.DB_NAME,
      attempt: connectionAttempts,
    });

    // Retry logic
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      const retryDelay = Math.min(connectionAttempts * 2000, 10000);
      logger.info(`Retrying database connection in ${retryDelay}ms...`);

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return initializeDatabase();
    }

    throw error;
  }
}

function setupConnectionHandlers(): void {
  const pool = (sequelize.connectionManager as any).pool;

  // Handle connection errors after initial connection
  pool?.on("error", (err: Error) => {
    logger.error("Database pool error", { error: err.message });
    isConnected = false;
  });

  // Log when connections are acquired
  pool?.on("acquire", () => {
    const poolSize = pool?.size || 0;
    const available = pool?.available || 0;

    logger.debug("Database connection acquired", {
      poolSize,
      available,
      inUse: poolSize - available,
    });
  });

  // Log when connections are released
  pool?.on("remove", () => {
    logger.debug("Database connection removed from pool");
  });
}

// Graceful shutdown
export async function closeDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    logger.info("Closing database connection...");

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

// Health check
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  details: any;
}> {
  try {
    await sequelize.authenticate();

    const pool = (sequelize.connectionManager as any).pool;
    const poolInfo = {
      size: pool?.size || 0,
      available: pool?.available || 0,
      using: (pool?.size || 0) - (pool?.available || 0),
      waiting: pool?.pending || 0,
    };

    return {
      healthy: true,
      details: {
        connected: isConnected,
        host: config.DB_HOST,
        database: config.DB_NAME,
        pool: poolInfo,
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

// Get connection status
export function isConnectedToDatabase(): boolean {
  return isConnected;
}

// Manual connection retry (useful for health checks)
export async function retryConnection(): Promise<boolean> {
  if (isConnected) {
    return true;
  }

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
