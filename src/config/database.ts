import { Sequelize, Options } from "sequelize";
import { env } from "./env";

const config: Options = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  dialect: "postgres",
  logging: env.NODE_ENV === "development" ? console.log : false,

  // Optimized connection pooling
  pool: {
    max: 20,
    min: 5,
    acquire: 60000,
    idle: 10000,
    evict: 1000,
  },

  // Connection retry configuration
  retry: {
    max: 3,
    timeout: 3000,
  },

  define: {
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
};

export const sequelize = new Sequelize(config);

export async function connectDatabase(): Promise<void> {
  let retries = 5;

  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log("✅ Database connected successfully");

      // NEVER use sync in production - use migrations instead
      if (env.NODE_ENV === "development") {
        console.warn("⚠️  Using sync() - not recommended for production");
        await sequelize.sync({ alter: false });
      }

      return;
    } catch (error) {
      retries--;
      console.error(
        `❌ Database connection failed. Retries left: ${retries}`,
        error
      );

      if (retries === 0) {
        throw new Error(
          "Failed to connect to database after multiple attempts"
        );
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await sequelize.close();
    console.log("✅ Database disconnected gracefully");
  } catch (error) {
    console.error("❌ Error disconnecting database:", error);
    throw error;
  }
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (transaction: any) => Promise<T>
): Promise<T> {
  const transaction = await sequelize.transaction();
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
