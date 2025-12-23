import { APP_CONSTANTS, ErrorCode } from '../../config/constants';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, any>;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: Record<string, any>,
    isOperational = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: Record<string, any>): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      APP_CONSTANTS.ERROR_CODES.VALIDATION_ERROR,
      message,
      details
    );
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.UNAUTHORIZED,
      APP_CONSTANTS.ERROR_CODES.UNAUTHORIZED,
      message
    );
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.FORBIDDEN,
      APP_CONSTANTS.ERROR_CODES.FORBIDDEN,
      message
    );
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.NOT_FOUND,
      APP_CONSTANTS.ERROR_CODES.NOT_FOUND,
      message
    );
  }

  static conflict(message: string): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.CONFLICT,
      APP_CONSTANTS.ERROR_CODES.CONFLICT,
      message
    );
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      APP_CONSTANTS.ERROR_CODES.INTERNAL_ERROR,
      message,
      undefined,
      false
    );
  }
}
