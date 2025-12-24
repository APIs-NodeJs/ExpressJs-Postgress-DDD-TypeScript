import { APP_CONSTANTS } from '../../config/constants';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: Record<string, any>): AppError {
    return new AppError(APP_CONSTANTS.HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(APP_CONSTANTS.HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED', message);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(APP_CONSTANTS.HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', message);
  }
}
