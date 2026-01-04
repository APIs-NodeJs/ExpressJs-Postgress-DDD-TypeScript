// src/core/infrastructure/database.ts

import { Sequelize, SequelizeOptions } from 'sequelize-typescript';
import { config } from '@core/config';
import { Logger } from './logger';
import { UserModel } from '@modules/auth/infrastructure/models/user.model';
import { SessionModel } from '@modules/auth/infrastructure/models/session.model';
import { WorkspaceModel } from '@modules/workspace/infrastructure/models/workspace.model';
import { WorkspaceMemberModel } from '@modules/workspace/infrastructure/models/workspace-member.model';
import { WorkspaceInvitationModel } from '@modules/workspace/infrastructure/models/workspace-invitation.model';

const logger = new Logger('Database');

export class Database {
  private static instance: Sequelize | null = null;
  private static isConnected = false;

  static getInstance(): Sequelize {
    if (!Database.instance) {
      const sequelizeConfig: SequelizeOptions = {
        dialect: 'postgres',
        host: config.DB_HOST,
        port: config.DB_PORT,
        username: config.DB_USER,
        password: config.DB_PASSWORD,
        database: config.DB_NAME,
        models: [
          UserModel,
          SessionModel,
          WorkspaceModel,
          WorkspaceMemberModel,
          WorkspaceInvitationModel,
        ],
        pool: {
          max: config.DB_POOL_MAX,
          min: config.DB_POOL_MIN,
          idle: config.DB_POOL_IDLE,
          acquire: 60000,
          evict: 1000,
        },
        logging: config.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true,
          paranoid: true,
        },
        dialectOptions: {
          ssl:
            config.NODE_ENV === 'production'
              ? {
                  require: true,
                  rejectUnauthorized: false,
                }
              : false,
        },
        retry: {
          max: 3,
          match: [
            /SequelizeConnectionError/,
            /SequelizeConnectionRefusedError/,
            /SequelizeHostNotFoundError/,
            /SequelizeHostNotReachableError/,
            /SequelizeInvalidConnectionError/,
            /SequelizeConnectionTimedOutError/,
          ],
        },
      };

      Database.instance = new Sequelize(sequelizeConfig);
    }

    return Database.instance;
  }

  static async connect(): Promise<void> {
    if (Database.isConnected) {
      logger.info('Database already connected');
      return;
    }

    try {
      const sequelize = Database.getInstance();
      await sequelize.authenticate();
      Database.isConnected = true;
      logger.info('Database connection established successfully', {
        host: config.DB_HOST,
        database: config.DB_NAME,
      });

      // Sync models only in development
      if (config.NODE_ENV === 'development') {
        await sequelize.sync({ alter: false });
        logger.info('Database models synchronized');
      }
    } catch (error) {
      Database.isConnected = false;
      logger.error('Unable to connect to the database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        host: config.DB_HOST,
        database: config.DB_NAME,
      });
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (!Database.isConnected || !Database.instance) {
      logger.info('Database not connected, skipping disconnect');
      return;
    }

    try {
      await Database.instance.close();
      Database.isConnected = false;
      Database.instance = null;
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const sequelize = Database.getInstance();
      await sequelize.authenticate();
      return true;
    } catch (error) {
      logger.error('Database connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  static isConnectionEstablished(): boolean {
    return Database.isConnected;
  }

  static async transaction<T>(callback: (transaction: any) => Promise<T>): Promise<T> {
    const sequelize = Database.getInstance();
    return sequelize.transaction(callback);
  }
}
