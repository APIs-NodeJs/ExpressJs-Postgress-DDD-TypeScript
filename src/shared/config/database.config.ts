import { Sequelize, Options } from 'sequelize';
import { config } from './env.config';

const getPoolConfig = () => {
  const isProd = config.NODE_ENV === 'production';
  const isTest = config.NODE_ENV === 'test';

  return {
    max: isProd ? 20 : isTest ? 2 : 5,
    min: isProd ? 5 : 0,
    acquire: 60000,
    idle: isTest ? 1000 : 10000,
    evict: 1000,
  };
};

const sequelizeConfig: Options = {
  dialect: 'postgres',
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  username: config.DB_USER,
  password: config.DB_PASSWORD,
  pool: getPoolConfig(),
  logging: config.NODE_ENV === 'development' ? console.log : false,
  timezone: '+00:00',
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
};

export const sequelize = new Sequelize(sequelizeConfig);

export async function initializeDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    if (config.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Database models synchronized');
    }
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  await sequelize.close();
  console.log('✅ Database connection closed');
}
