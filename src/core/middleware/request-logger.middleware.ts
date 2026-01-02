import { Request, Response, NextFunction } from 'express';
import { Logger } from '@core/infrastructure/logger';
import { config } from '@core/config';

const logger = new Logger('HTTP');

// ANSI color codes for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Status colors
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function getStatusColor(statusCode: number): string {
  if (!config.LOG_COLORIZE) return '';

  if (statusCode >= 500) return colors.red;
  if (statusCode >= 400) return colors.yellow;
  if (statusCode >= 300) return colors.cyan;
  if (statusCode >= 200) return colors.green;
  return colors.blue;
}

function getMethodColor(method: string): string {
  if (!config.LOG_COLORIZE) return '';

  const methodColors: { [key: string]: string } = {
    GET: colors.green,
    POST: colors.blue,
    PUT: colors.yellow,
    PATCH: colors.magenta,
    DELETE: colors.red,
  };

  return methodColors[method] || colors.cyan;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getDurationColor(ms: number): string {
  if (!config.LOG_COLORIZE) return '';

  if (ms < 100) return colors.green;
  if (ms < 500) return colors.yellow;
  return colors.red;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (!config.LOG_HTTP_REQUESTS) {
    return next();
  }

  const startTime = Date.now();
  const startHrTime = process.hrtime();

  // Skip logging for health check endpoints in production
  if (config.NODE_ENV === 'production' && (req.path === '/health' || req.path === '/ready')) {
    return next();
  }

  // Log incoming request (only in debug mode)
  if (config.LOG_LEVEL === 'debug') {
    const methodColor = getMethodColor(req.method);

    if (config.LOG_FORMAT === 'simple' && config.LOG_COLORIZE) {
      console.log(
        `${colors.dim}→ ${methodColor}${colors.bright}${req.method}${colors.reset} ` +
          `${colors.cyan}${req.path}${colors.reset} ` +
          `${colors.dim}[${req.correlationId?.substring(0, 8)}]${colors.reset}`
      );
    } else {
      logger.info('Incoming request', {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    }
  }

  // Capture response
  const originalSend = res.send;
  res.send = function (data): Response {
    res.send = originalSend;

    const duration = Date.now() - startTime;
    const hrDuration = process.hrtime(startHrTime);
    const durationMs = hrDuration[0] * 1000 + hrDuration[1] / 1000000;
    const statusCode = res.statusCode;

    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    // Simple colorized format
    if (config.LOG_FORMAT === 'simple' && config.LOG_COLORIZE) {
      const statusColor = getStatusColor(statusCode);
      const methodColor = getMethodColor(req.method);
      const durationColor = getDurationColor(durationMs);

      console.log(
        `${statusColor}${colors.bright}${statusCode}${colors.reset} ` +
          `${methodColor}${colors.bright}${req.method.padEnd(6)}${colors.reset} ` +
          `${colors.cyan}${req.path.padEnd(30)}${colors.reset} ` +
          `${durationColor}${formatDuration(durationMs).padStart(8)}${colors.reset} ` +
          `${colors.dim}[${req.correlationId?.substring(0, 8)}]${colors.reset}`
      );
    }
    // JSON format
    else {
      logger[logLevel]('Request completed', {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        statusCode,
        duration: `${durationMs.toFixed(2)}ms`,
        contentLength: res.get('content-length') || 0,
        userAgent: req.get('user-agent'),
        ip: req.ip,
      });
    }

    // Log slow requests
    if (durationMs > 1000) {
      logger.warn('Slow request detected', {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        duration: `${durationMs.toFixed(2)}ms`,
      });
    }

    return originalSend.call(this, data);
  };

  next();
}
