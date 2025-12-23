import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../shared/domain/AppError';
import { APP_CONSTANTS } from '../../../config/constants';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId: req.id,
      },
    });
    return;
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  res.status(APP_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: {
      code: APP_CONSTANTS.ERROR_CODES.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      requestId: req.id,
    },
  });
}
