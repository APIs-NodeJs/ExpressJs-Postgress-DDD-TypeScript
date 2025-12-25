import { APP_CONSTANTS } from "../../config/constants";
import { ERROR_CODES, ERROR_MESSAGES, ErrorCode } from "./ErrorCodes";

/**
 * Custom application error class with standardized error codes
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, any>,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * 400 - Bad Request
   */
  static badRequest(message?: string, details?: Record<string, any>): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      message || ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
      details
    );
  }

  /**
   * 401 - Unauthorized (Authentication failed)
   */
  static unauthorized(message?: string, code?: ErrorCode): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.UNAUTHORIZED,
      code || ERROR_CODES.INVALID_CREDENTIALS,
      message || ERROR_MESSAGES[ERROR_CODES.INVALID_CREDENTIALS]
    );
  }

  /**
   * 401 - Invalid credentials
   */
  static invalidCredentials(): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.INVALID_CREDENTIALS,
      ERROR_MESSAGES[ERROR_CODES.INVALID_CREDENTIALS]
    );
  }

  /**
   * 401 - Account locked
   */
  static accountLocked(remainingMinutes: number): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.ACCOUNT_LOCKED,
      `Account is temporarily locked. Please try again in ${remainingMinutes} minute(s).`,
      { remainingMinutes }
    );
  }

  /**
   * 401 - Invalid or expired token
   */
  static invalidToken(message?: string): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.INVALID_TOKEN,
      message || ERROR_MESSAGES[ERROR_CODES.INVALID_TOKEN]
    );
  }

  /**
   * 401 - Token expired
   */
  static tokenExpired(): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.TOKEN_EXPIRED,
      ERROR_MESSAGES[ERROR_CODES.TOKEN_EXPIRED]
    );
  }

  /**
   * 403 - Forbidden (Insufficient permissions)
   */
  static forbidden(message?: string): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.INSUFFICIENT_PERMISSIONS,
      message || ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_PERMISSIONS]
    );
  }

  /**
   * 404 - Not Found
   */
  static notFound(message?: string, resource?: string): AppError {
    const code =
      resource === "user"
        ? ERROR_CODES.USER_NOT_FOUND
        : resource === "workspace"
          ? ERROR_CODES.WORKSPACE_NOT_FOUND
          : ERROR_CODES.RESOURCE_NOT_FOUND;

    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.NOT_FOUND,
      code,
      message || ERROR_MESSAGES[code]
    );
  }

  /**
   * 409 - Conflict
   */
  static conflict(message?: string, code?: ErrorCode): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.CONFLICT,
      code || ERROR_CODES.EMAIL_ALREADY_EXISTS,
      message || ERROR_MESSAGES[ERROR_CODES.EMAIL_ALREADY_EXISTS]
    );
  }

  /**
   * 409 - Email already exists
   */
  static emailAlreadyExists(): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.CONFLICT,
      ERROR_CODES.EMAIL_ALREADY_EXISTS,
      ERROR_MESSAGES[ERROR_CODES.EMAIL_ALREADY_EXISTS]
    );
  }

  /**
   * 429 - Too Many Requests
   */
  static tooManyRequests(message?: string, retryAfter?: number): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.TOO_MANY_REQUESTS,
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message || ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_EXCEEDED],
      retryAfter ? { retryAfter } : undefined
    );
  }

  /**
   * 500 - Internal Server Error
   */
  static internal(message?: string): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_ERROR,
      message || ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
      undefined,
      false // Not operational - unexpected error
    );
  }

  /**
   * 500 - Database Error
   */
  static databaseError(message?: string): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.DATABASE_ERROR,
      message || ERROR_MESSAGES[ERROR_CODES.DATABASE_ERROR],
      undefined,
      false
    );
  }

  /**
   * Password validation error
   */
  static weakPassword(requirements?: string[]): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.WEAK_PASSWORD,
      ERROR_MESSAGES[ERROR_CODES.WEAK_PASSWORD],
      requirements ? { requirements } : undefined
    );
  }

  /**
   * 2FA errors
   */
  static twoFaRequired(): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.TWO_FA_REQUIRED,
      ERROR_MESSAGES[ERROR_CODES.TWO_FA_REQUIRED]
    );
  }

  static invalid2FaToken(): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.INVALID_2FA_TOKEN,
      ERROR_MESSAGES[ERROR_CODES.INVALID_2FA_TOKEN]
    );
  }

  /**
   * Password reset errors
   */
  static invalidResetToken(): AppError {
    return new AppError(
      APP_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INVALID_RESET_TOKEN,
      ERROR_MESSAGES[ERROR_CODES.INVALID_RESET_TOKEN]
    );
  }

  /**
   * Check if error is operational (expected) or programming error
   */
  isOperationalError(): boolean {
    return this.isOperational;
  }

  /**
   * Convert to JSON for API response
   */
  toJSON(): Record<string, any> {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}
