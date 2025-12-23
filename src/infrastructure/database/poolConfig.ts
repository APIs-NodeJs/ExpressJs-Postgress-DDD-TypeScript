
import { Options } from 'sequelize';

export const getDatabaseConfig = (): Options => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    
    // Optimized pool configuration
    pool: {
      max: isProduction ? 20 : 10,
      min: isProduction ? 5 : 2,
      acquire: 30000,
      idle: 10000,
      evict: 1000, // Run eviction every second
    },
    
    // Query optimization
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    benchmark: true,
    
    // Connection retry
    retry: {
      max: 3,
      backoffBase: 1000,
      backoffExponent: 1.5,
    },
    
    // Statement timeout
    dialectOptions: {
      statement_timeout: 30000, // 30 seconds
      idle_in_transaction_session_timeout: 60000, // 1 minute
    },
  };
};