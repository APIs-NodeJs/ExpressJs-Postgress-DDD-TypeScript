import { Sequelize } from "sequelize";
import { config } from "./env.config";
import { logger } from "../shared/utils/logger";

export const sequelize = new Sequelize({
  dialect: "postgres",
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  username: config.DB_USER,
  password: config.DB_PASSWORD,

  // Connection pooling
  pool: {
    max: config.NODE_ENV === "production" ? 20 : 5,
    min: config.NODE_ENV === "production" ? 5 : 0,
    acquire: 60000,
    idle: 10000,
    evict: 1000,
  },

  // Logging
  logging: (msg) => logger.debug(msg),

  // Performance
  benchmark: config.NODE_ENV === "development",

  // Timezone
  timezone: "+00:00",

  // Retry logic
  retry: {
    max: 3,
    timeout: 3000,
  },
});

export async function initializeDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info("✅ Database connection established");

    if (config.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      logger.info("✅ Database models synchronized");
    }
  } catch (error) {
    logger.error("❌ Unable to connect to database:", error);
    throw error;
  }
}
