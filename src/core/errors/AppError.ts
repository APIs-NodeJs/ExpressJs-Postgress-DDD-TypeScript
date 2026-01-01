/**
 * Base Application Error Class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: unknown
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON() {
    const result: Record<string, any> = {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
    };

    if (this.code) {
      result.code = this.code;
    }

    if (this.details !== undefined) {
      result.details = this.details;
    }

    if (process.env.NODE_ENV === 'development' && this.stack) {
      result.stack = this.stack;
    }

    return result;
  }
}

/**
 * Validation Error - 400 Bad Request
 * Use for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
  }
}

/**
 * Unauthorized Error - 401 Unauthorized
 * Use for authentication failures
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden Error - 403 Forbidden
 * Use for authorization failures
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, true, 'FORBIDDEN');
  }
}

/**
 * Not Found Error - 404 Not Found
 * Use when resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', id?: string | number) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, 404, true, 'NOT_FOUND');
  }
}

/**
 * Conflict Error - 409 Conflict
 * Use for duplicate resource errors
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, true, 'CONFLICT');
  }
}

/**
 * Too Many Requests Error - 429 Too Many Requests
 * Use for rate limiting
 */
export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true, 'TOO_MANY_REQUESTS');
  }
}

/**
 * Internal Server Error - 500 Internal Server Error
 * Use for unexpected server errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(message, 500, false, 'INTERNAL_SERVER_ERROR', details);
  }
}

/**
 * Service Unavailable Error - 503 Service Unavailable
 * Use when external service is down
 */
export class ServiceUnavailableError extends AppError {
  constructor(service: string = 'Service') {
    super(`${service} is currently unavailable`, 503, true, 'SERVICE_UNAVAILABLE');
  }
}

/**
 * Database Error - 500 Internal Server Error
 * Use for database-related errors
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database error', details?: unknown) {
    super(message, 500, false, 'DATABASE_ERROR', details);
  }
}

/**
 * Bad Request Error - 400 Bad Request
 * Use for malformed requests
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400, true, 'BAD_REQUEST');
  }
}
