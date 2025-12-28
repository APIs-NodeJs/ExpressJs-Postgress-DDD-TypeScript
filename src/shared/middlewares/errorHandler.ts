import { Request, Response, NextFunction } from 'express';
import { AppError, isAppError } from '../errors/AppError';
import { ResponseHandler } from '../responses/ResponseHandler';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = (req as any).id;

  if (isAppError(err)) {
    return ResponseHandler.error(
      res,
      err.statusCode,
      err.code,
      err.message,
      err.details,
      requestId
    );
  }

  if (err instanceof ZodError) {
    const validationErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      value: undefined,
    }));

    return ResponseHandler.validationError(res, validationErrors, requestId);
  }

  if (err.name && err.name.startsWith('Sequelize')) {
    const message = err.name === 'SequelizeUniqueConstraintError'
      ? 'Resource already exists'
      : 'A database error occurred';

    const statusCode = err.name === 'SequelizeUniqueConstraintError' ? 409 : 400;

    return ResponseHandler.error(
      res,
      statusCode,
      err.name,
      message,
      process.env.NODE_ENV === 'development' ? err.message : undefined,
      requestId
    );
  }

  console.error('Unexpected error:', err);

  return ResponseHandler.error(
    res,
    500,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    process.env.NODE_ENV === 'development' ? err.stack : undefined,
    requestId
  );
};
