import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_VERSION: z.string().default('v1'),

  // Database
  DB_HOST: z.string(),
  DB_PORT: z.string().transform(Number).default('5432'),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_POOL_MAX: z.string().transform(Number).default('20'),
  DB_POOL_MIN: z.string().transform(Number).default('5'),
  DB_POOL_IDLE: z.string().transform(Number).default('10000'),

  // Redis
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),
  REDIS_REQUIRED: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3001'),
  CORS_CREDENTIALS: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('json'),
  LOG_COLORIZE: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  LOG_SQL_QUERIES: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  LOG_HTTP_REQUESTS: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  LOG_ERRORS_ONLY: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // File Logging
  LOG_FILE_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  LOG_FILE_PATH: z.string().default('logs'),
  LOG_FILE_MAX_SIZE: z.string().default('10m'),
  LOG_FILE_MAX_FILES: z.string().transform(Number).default('7'),

  // Features
  SOCKET_CORS_ORIGIN: z.string().default('http://localhost:3001'),
  SOCKET_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  SWAGGER_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  COMPRESSION_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  HEALTH_CHECK_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
});

type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => err.path.join('.')).join(', ');
      throw new Error(`Environment validation failed. Missing or invalid: ${missingVars}`);
    }
    throw error;
  }
}

export const config = validateEnv();

export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

// Helper functions
export const shouldLog = (level: 'error' | 'warn' | 'info' | 'debug'): boolean => {
  if (config.LOG_ERRORS_ONLY && level !== 'error') return false;

  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  return levels[level] <= levels[config.LOG_LEVEL];
};

export const shouldLogSQL = (): boolean => {
  return config.LOG_SQL_QUERIES && isDevelopment;
};

export const shouldLogHTTP = (): boolean => {
  return config.LOG_HTTP_REQUESTS;
};
