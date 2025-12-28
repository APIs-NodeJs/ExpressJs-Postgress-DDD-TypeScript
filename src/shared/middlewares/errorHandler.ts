import { Request, Response, NextFunction } from 'express';
import { isAppError } from '../errors/AppError';
import { ResponseHandler } from '../responses/ResponseHandler';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = (req as any).id;

  // Handle AppError instances
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

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
      value: undefined,
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

    return ResponseHandler.error(
      res,
      statusCode,
      err.name,
      message,
      process.env.NODE_ENV === 'development' ? err.message : undefined,
      requestId
    );
  }

  // Handle unexpected errors
  console.error('Unexpected error:', err);

  return ResponseHandler.error(
    res,
    500,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    process.env.NODE_ENV === 'development' ? err.stack : undefined,
    requestId
  );
};
