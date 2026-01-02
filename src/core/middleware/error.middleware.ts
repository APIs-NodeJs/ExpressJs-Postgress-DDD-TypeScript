import { Request, Response, NextFunction } from 'express';
import { AppError } from '@core/errors';
import { Logger } from '@core/infrastructure/logger';
import { ZodError } from 'zod';

const logger = new Logger('ErrorMiddleware');

interface ErrorResponse {
  success: false;
  code: string;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  correlationId?: string;
  stack?: string;
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(error);
  }

  const correlationId = req.correlationId;

  // Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    logger.warn('Validation error', {
      correlationId,
      path: req.path,
      errors: formattedErrors,
    });

    const response: ErrorResponse = {
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors: formattedErrors,
      correlationId,
    };

    res.status(400).json(response);
    return;
  }

  // Application errors
  if (error instanceof AppError) {
    logger.warn('Application error', {
      correlationId,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      path: req.path,
      method: req.method,
    });

    const response: ErrorResponse = {
      success: false,
      code: error.code,
      message: error.message,
      correlationId,
    };

    res.status(error.statusCode).json(response);
    return;
  }

  // Unexpected errors
  logger.error('Unexpected error', {
    correlationId,
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
  });

  const response: ErrorResponse = {
    success: false,
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message,
    correlationId,
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(500).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  logger.warn('Route not found', {
    correlationId: req.correlationId,
    method: req.method,
    path: req.path,
  });

  const response: ErrorResponse = {
    success: false,
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    correlationId: req.correlationId,
  };

  res.status(404).json(response);
}