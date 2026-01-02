import { Sequelize } from 'sequelize-typescript';
import { config } from '@core/config';
import { Logger } from './logger';

const logger = new Logger('Database');

export class Database {
  private static instance: Sequelize;

  static getInstance(): Sequelize {
    if (!Database.instance) {
      Database.instance = new Sequelize({
        dialect: 'postgres',
        host: config.DB_HOST,
        port: config.DB_PORT,
        username: config.DB_USER,
        password: config.DB_PASSWORD,
        database: config.DB_NAME,
        pool: {
          max: config.DB_POOL_MAX,
          min: config.DB_POOL_MIN,
          idle: config.DB_POOL_IDLE,
        },
        logging: config.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true,
        },
      });
    }

    return Database.instance;
  }

  static async connect(): Promise<void> {
    try {
      const sequelize = Database.getInstance();
      await sequelize.authenticate();
      logger.info('Database connection established successfully');

      if (config.NODE_ENV === 'development') {
        await sequelize.sync({ alter: false });
        logger.info('Database models synchronized');
      }
    } catch (error) {
      logger.error('Unable to connect to the database', { error });
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    try {
      const sequelize = Database.getInstance();
      await sequelize.close();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection', { error });
      throw error;
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const sequelize = Database.getInstance();
      await sequelize.authenticate();
      return true;
    } catch {
      return false;
    }
  }
}