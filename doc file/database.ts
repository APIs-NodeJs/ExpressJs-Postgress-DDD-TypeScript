import { Sequelize, Options } from 'sequelize';
import { env } from './env';

const config: Options = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  dialect: 'postgres',
  logging: env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
};

export const sequelize = new Sequelize(config);

export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    if (env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synchronized');
    }
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await sequelize.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
}
