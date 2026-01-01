import { Request, Response, NextFunction } from 'express';
import { AppError } from '@core/errors/AppError';
import { logger } from '@core/config/logger';

/**
 * Interface for error response
 */
interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
  details?: unknown;
  stack?: string;
  timestamp: string;
  path: string;
  method: string;
}

/**
 * Global error handler middleware
 * Catches all errors and sends appropriate responses
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let code: string | undefined;
  let details: unknown;
  let isOperational = false;

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
    isOperational = err.isOperational;
  }

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
    details = (err as any).errors?.map((e: any) => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));
    isOperational = true;
  }

  // Handle Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_ENTRY';
    details = (err as any).errors?.map((e: any) => ({
      field: e.path,
      value: e.value,
    }));
    isOperational = true;
  }

  // Handle Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Invalid reference';
    code = 'FOREIGN_KEY_VIOLATION';
    isOperational = true;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
    isOperational = true;
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
    isOperational = true;
  }

  // Handle Joi validation errors
  if (err.name === 'ValidationError' && (err as any).isJoi) {
    statusCode = 400;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
    details = (err as any).details?.map((d: any) => ({
      field: d.path.join('.'),
      message: d.message,
      type: d.type,
    }));
    isOperational = true;
  }

  // Handle syntax errors (e.g., malformed JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON payload';
    code = 'INVALID_JSON';
    isOperational = true;
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    status: 'error',
    message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  if (code) {
    errorResponse.code = code;
  }

  if (details) {
    errorResponse.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Log error
  if (!isOperational || statusCode >= 500) {
    logger.error('Error occurred:', {
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        code,
        details,
      },
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params,
        ip: req.ip,
        userId: (req as any).user?.id,
      },
    });
  } else {
    logger.warn('Operational error occurred:', {
      error: {
        name: err.name,
        message: err.message,
        code,
      },
      request: {
        method: req.method,
        url: req.url,
        ip: req.ip,
      },
    });
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 Not Found errors
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ErrorResponse = {
    status: 'error',
    message: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  logger.warn('Route not found:', {
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  res.status(404).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
