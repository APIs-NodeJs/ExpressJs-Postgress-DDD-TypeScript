// src/shared/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { isAppError } from '../errors/AppError';
import { ResponseHandler } from '../responses/ResponseHandler';
import { ZodError } from 'zod';
import { Logger } from '../../core/utils/Logger';

const logger = new Logger('ErrorHandler');

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = (req as any).id;

  // Always log the full error server-side (with stack trace)
  logger.error('Request error', {
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
    ip: req.ip,
  });

  // Handle AppError instances
  if (isAppError(err)) {
    // Never send stack traces or internal details to client
    return ResponseHandler.error(
      res,
      err.statusCode,
      err.code,
      err.message,
      undefined, // Don't send details to client
      requestId
    );
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
      value: undefined, // Don't expose actual values
    }));

    return ResponseHandler.validationError(res, validationErrors, requestId);
  }

  // Handle Sequelize errors
  if (err.name && err.name.startsWith('Sequelize')) {
    const message =
      err.name === 'SequelizeUniqueConstraintError'
        ? 'Resource already exists'
        : 'A database error occurred';

    const statusCode = err.name === 'SequelizeUniqueConstraintError' ? 409 : 400;

    // Never expose SQL queries or database details
    return ResponseHandler.error(
      res,
      statusCode,
      err.name,
      message,
      undefined, // No database details to client
      requestId
    );
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return ResponseHandler.error(
      res,
      401,
      'AUTHENTICATION_ERROR',
      'Invalid or expired token',
      undefined,
      requestId
    );
  }

  // Handle unexpected errors - NEVER expose internals
  return ResponseHandler.error(
    res,
    500,
    'INTERNAL_ERROR',
    'An unexpected error occurred',
    undefined, // NEVER send stack trace or error details
    requestId
  );
};
