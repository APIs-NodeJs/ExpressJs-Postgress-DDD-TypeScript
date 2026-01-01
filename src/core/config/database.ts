import { Sequelize, Options } from 'sequelize';
import { logger, logDatabaseConnection } from './logger';

const config: Options = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'myapp_dev',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dialect: 'postgres',
  logging: process.env.DB_LOGGING === 'true' ? (msg) => logger.debug(msg) : false,
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false,
    } : false,
  },
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true,
  },
};

export const sequelize = new Sequelize(config);

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logDatabaseConnection(
      process.env.DB_HOST || 'localhost',
      process.env.DB_NAME || 'myapp_dev'
    );
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    throw error;
  }
};

export const syncDatabase = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.sync({ force });
    logger.info('Database synchronized successfully');
  } catch (error) {
    logger.error('Unable to sync database:', error);
    throw error;
  }
};