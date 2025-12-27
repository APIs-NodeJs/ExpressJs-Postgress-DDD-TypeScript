/**
 * Base Application Error
 */
export abstract class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly isOperational: boolean = true,
    public readonly details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
    this.name = this.constructor.name;
  }
}

/**
 * 400 - Bad Request
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR", true, details);
  }
}

/**
 * 401 - Unauthorized
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "UNAUTHORIZED", true);
  }
}

/**
 * 403 - Forbidden
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, 403, "FORBIDDEN", true);
  }
}

/**
 * 404 - Not Found
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND", true);
  }
}

/**
 * 409 - Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT", true);
  }
}

/**
 * 422 - Unprocessable Entity
 */
export class UnprocessableEntityError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, "UNPROCESSABLE_ENTITY", true, details);
  }
}

/**
 * 429 - Too Many Requests
 */
export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests", retryAfter?: number) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", true, { retryAfter });
  }
}

/**
 * 500 - Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error", details?: any) {
    super(message, 500, "INTERNAL_ERROR", false, details);
  }
}

/**
 * 503 - Service Unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = "Service temporarily unavailable") {
    super(message, 503, "SERVICE_UNAVAILABLE", true);
  }
}

/**
 * Database Error
 */
export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, "DATABASE_ERROR", false, details);
  }
}

/**
 * External Service Error
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(
      `External service error: ${service} - ${message}`,
      502,
      "EXTERNAL_SERVICE_ERROR",
      true,
      details
    );
  }
}

/**
 * Business Logic Error
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, "BUSINESS_LOGIC_ERROR", true, details);
  }
}

/**
 * Error factory for common scenarios
 */
export class ErrorFactory {
  static invalidCredentials(): UnauthorizedError {
    return new UnauthorizedError("Invalid credentials");
  }

  static tokenExpired(): UnauthorizedError {
    return new UnauthorizedError("Token has expired");
  }

  static invalidToken(): UnauthorizedError {
    return new UnauthorizedError("Invalid authentication token");
  }

  static userNotFound(): NotFoundError {
    return new NotFoundError("User");
  }

  static emailAlreadyExists(): ConflictError {
    return new ConflictError("Email already registered");
  }

  static workspaceNotFound(): NotFoundError {
    return new NotFoundError("Workspace");
  }

  static insufficientPermissions(): ForbiddenError {
    return new ForbiddenError(
      "Insufficient permissions to perform this action"
    );
  }

  static accountLocked(): ForbiddenError {
    return new ForbiddenError(
      "Account is locked due to multiple failed login attempts"
    );
  }

  static accountSuspended(): ForbiddenError {
    return new ForbiddenError("Account has been suspended");
  }

  static invalidInput(field: string, reason: string): ValidationError {
    return new ValidationError(`Invalid ${field}: ${reason}`);
  }

  static requiredField(field: string): ValidationError {
    return new ValidationError(`${field} is required`);
  }

  static databaseConnection(): DatabaseError {
    return new DatabaseError("Database connection failed");
  }

  static transactionFailed(reason?: string): DatabaseError {
    return new DatabaseError(
      `Transaction failed${reason ? `: ${reason}` : ""}`,
      { reason }
    );
  }
}

/**
 * Type guard to check if error is AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error is operational
 */
export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}

/**
 * Extract error stack safely
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}
