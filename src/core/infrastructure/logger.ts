import winston from 'winston';
import { config, shouldLog } from '@core/config';
import path from 'path';
import fs from 'fs';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

// Create logs directory if file logging is enabled
if (config.LOG_FILE_ENABLED && !fs.existsSync(config.LOG_FILE_PATH)) {
  fs.mkdirSync(config.LOG_FILE_PATH, { recursive: true });
}

// Custom format for better readability
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  config.LOG_COLORIZE ? winston.format.colorize({ all: true }) : winston.format.uncolorize(),
  winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
    const contextStr = context ? `[${context}]` : '';
    const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';

    return config.LOG_FORMAT === 'simple'
      ? `${timestamp} ${level} ${contextStr} ${message}${metaStr}`
      : `${timestamp} ${level} ${contextStr} ${message}${metaStr}`;
  })
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configure transports
const transports: winston.transport[] = [];

// Console transport
if (!config.LOG_ERRORS_ONLY || config.LOG_LEVEL === 'error') {
  transports.push(
    new winston.transports.Console({
      level: config.LOG_LEVEL,
      format: config.LOG_FORMAT === 'json' ? jsonFormat : consoleFormat,
    })
  );
}

// File transports (production)
if (config.LOG_FILE_ENABLED) {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(config.LOG_FILE_PATH, 'error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: parseSize(config.LOG_FILE_MAX_SIZE),
      maxFiles: config.LOG_FILE_MAX_FILES,
    })
  );

  // Combined log file
  if (!config.LOG_ERRORS_ONLY) {
    transports.push(
      new winston.transports.File({
        filename: path.join(config.LOG_FILE_PATH, 'combined.log'),
        format: jsonFormat,
        maxsize: parseSize(config.LOG_FILE_MAX_SIZE),
        maxFiles: config.LOG_FILE_MAX_FILES,
      })
    );
  }

  // HTTP requests log file
  if (config.LOG_HTTP_REQUESTS) {
    transports.push(
      new winston.transports.File({
        filename: path.join(config.LOG_FILE_PATH, 'http.log'),
        level: 'info',
        format: jsonFormat,
        maxsize: parseSize(config.LOG_FILE_MAX_SIZE),
        maxFiles: config.LOG_FILE_MAX_FILES,
      })
    );
  }
}

// Helper function to parse size strings like "10m" to bytes
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    k: 1024,
    m: 1024 * 1024,
    g: 1024 * 1024 * 1024,
  };

  const match = size.match(/^(\d+)([bkmg])?$/i);
  if (!match) return 10 * 1024 * 1024; // default 10MB

  const value = parseInt(match[1], 10);
  const unit = (match[2] || 'b').toLowerCase();

  return value * (units[unit] || 1);
}

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  levels,
  format: jsonFormat,
  transports,
  exitOnError: false,
  silent: config.LOG_ERRORS_ONLY && config.LOG_LEVEL !== 'error',
});

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  error(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      logger.error(message, { context: this.context, ...meta });
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      logger.warn(message, { context: this.context, ...meta });
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      logger.info(message, { context: this.context, ...meta });
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      logger.debug(message, { context: this.context, ...meta });
    }
  }

  // Specialized logging methods
  http(message: string, meta?: Record<string, unknown>): void {
    if (config.LOG_HTTP_REQUESTS && shouldLog('info')) {
      logger.info(message, { context: this.context, type: 'http', ...meta });
    }
  }

  sql(query: string, meta?: Record<string, unknown>): void {
    if (config.LOG_SQL_QUERIES && shouldLog('debug')) {
      logger.debug(query, { context: this.context, type: 'sql', ...meta });
    }
  }

  performance(label: string, duration: number, meta?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      logger.debug(`${label} completed`, {
        context: this.context,
        type: 'performance',
        duration: `${duration}ms`,
        ...meta,
      });
    }
  }
}
