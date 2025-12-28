import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
  AppError,
  isAppError,
} from './AppError';

export class ErrorFactory {
  static notFound(resource: string): NotFoundError {
    return new NotFoundError(resource);
  }

  static validation(message: string, details?: any): ValidationError {
    return new ValidationError(message, details);
  }

  static unauthorized(message?: string): UnauthorizedError {
    return new UnauthorizedError(message);
  }

  static forbidden(message?: string): ForbiddenError {
    return new ForbiddenError(message);
  }

  static conflict(message: string): ConflictError {
    return new ConflictError(message);
  }

  static internal(message?: string, details?: any): InternalServerError {
    return new InternalServerError(message, details);
  }
}

export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}

// Re-export for convenience
export { isAppError, AppError };
