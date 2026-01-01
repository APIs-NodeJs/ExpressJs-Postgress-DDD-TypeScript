import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

/**
 * Custom log levels
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * Custom colors for log levels
 */
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

/**
 * Determine log level based on environment
 */
const level = (): string => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : process.env.LOG_LEVEL || 'info';
};

/**
 * Custom format for console output
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = `
${JSON.stringify(meta, null, 2)}`;
    }
    
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

/**
 * Format for file output (JSON)
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Transport for console output
 */
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
});

/**
 * Transport for error logs (daily rotation)
 */
const errorFileTransport: DailyRotateFile = new DailyRotateFile({
  filename: path.join(process.env.LOG_DIR || 'logs', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  format: fileFormat,
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
});

/**
 * Transport for combined logs (daily rotation)
 */
const combinedFileTransport: DailyRotateFile = new DailyRotateFile({
  filename: path.join(process.env.LOG_DIR || 'logs', 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  format: fileFormat,
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true,
});

/**
 * Transport for HTTP logs (daily rotation)
 */
const httpFileTransport: DailyRotateFile = new DailyRotateFile({
  filename: path.join(process.env.LOG_DIR || 'logs', 'http-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'http',
  format: fileFormat,
  maxSize: '20m',
  maxFiles: '7d',
  zippedArchive: true,
});

/**
 * Create Winston logger instance
 */
export const logger = winston.createLogger({
  level: level(),
  levels,
  transports: [
    consoleTransport,
    errorFileTransport,
    combinedFileTransport,
    httpFileTransport,
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || 'logs', 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || 'logs', 'rejections.log'),
    }),
  ],
  exitOnError: false,
});

/**
 * Create stream for Morgan HTTP logger
 */
export const loggerStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

/**
 * Log application startup information
 */
export const logStartup = (): void => {
  logger.info('='.repeat(50));
  logger.info('🚀 Application Starting');
  logger.info('='.repeat(50));
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Node Version: ${process.version}`);
  logger.info(`Port: ${process.env.PORT}`);
  logger.info(`Log Level: ${level()}`);
  logger.info('='.repeat(50));
};

/**
 * Log database connection status
 */
export const logDatabaseConnection = (host: string, database: string): void => {
  logger.info(`📦 Database connected: ${host}/${database}`);
};

/**
 * Log Redis connection status
 */
export const logRedisConnection = (host: string, port: number): void => {
  logger.info(`🔴 Redis connected: ${host}:${port}`);
};

/**
 * Log server listening status
 */
export const logServerListening = (port: number): void => {
  logger.info(`🌐 Server is running on port ${port}`);
  logger.info(`📚 API Documentation: http://localhost:${port}/api-docs`);
};