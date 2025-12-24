import { APP_CONSTANTS } from "../../config/constants";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, any>,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: Record<string, any>): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      "BAD_REQUEST",
      message,
      details
    );
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.UNAUTHORIZED,
      "UNAUTHORIZED",
      message
    );
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Resource not found"): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.NOT_FOUND,
      "NOT_FOUND",
      message
    );
  }

  static conflict(message: string): AppError {
    return new AppError(409, "CONFLICT", message);
  }

  static tooManyRequests(message = "Too many requests"): AppError {
    return new AppError(429, "TOO_MANY_REQUESTS", message);
  }

  static internal(message = "Internal server error"): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "INTERNAL_ERROR",
      message,
      undefined,
      false // Not operational
    );
  }
}
