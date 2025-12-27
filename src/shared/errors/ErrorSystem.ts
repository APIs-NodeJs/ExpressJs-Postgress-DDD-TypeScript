import { logger } from "../utils/logger";

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = "LOW", // Minor issues, system continues normally
  MEDIUM = "MEDIUM", // Important but not critical
  HIGH = "HIGH", // Serious issue requiring attention
  CRITICAL = "CRITICAL", // System-threatening issue
}

/**
 * Error categories for better organization
 */
export enum ErrorCategory {
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  VALIDATION = "VALIDATION",
  DATABASE = "DATABASE",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
  BUSINESS_LOGIC = "BUSINESS_LOGIC",
  SYSTEM = "SYSTEM",
  NETWORK = "NETWORK",
}

/**
 * Base application error with rich metadata
 */
export abstract class BaseError extends Error {
  public readonly timestamp: Date;
  public readonly errorId: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;
  public readonly userId?: string;
  public readonly requestId?: string;

  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
    options: {
      category: ErrorCategory;
      severity?: ErrorSeverity;
      isOperational?: boolean;
      context?: Record<string, any>;
      userId?: string;
      requestId?: string;
      cause?: Error;
    }
  ) {
    super(message);

    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.errorId = this.generateErrorId();
    this.category = options.category;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.isOperational = options.isOperational ?? true;
    this.context = options.context;
    this.userId = options.userId;
    this.requestId = options.requestId;

    if (options.cause) {
      this.cause = options.cause;
    }

    Error.captureStackTrace(this, this.constructor);
  }

  private generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error details for logging
   */
  public toJSON() {
    return {
      errorId: this.errorId,
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      category: this.category,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      isOperational: this.isOperational,
      context: this.context,
      userId: this.userId,
      requestId: this.requestId,
      stack: this.stack,
    };
  }

  /**
   * Get safe error details for client response
   */
  public toClientJSON() {
    return {
      code: this.code,
      message: this.message,
      errorId: this.errorId,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

/**
 * Authentication Errors
 */
export class AuthenticationError extends BaseError {
  constructor(
    message: string = "Authentication failed",
    options?: {
      context?: Record<string, any>;
      userId?: string;
      requestId?: string;
      cause?: Error;
    }
  ) {
    super(message, 401, "AUTHENTICATION_ERROR", {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      ...options,
    });
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor(options?: { requestId?: string; context?: Record<string, any> }) {
    super("Invalid credentials provided", options);
    this.code = "INVALID_CREDENTIALS";
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(options?: { requestId?: string; context?: Record<string, any> }) {
    super("Authentication token has expired", options);
    this.code = "TOKEN_EXPIRED";
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor(options?: { requestId?: string; context?: Record<string, any> }) {
    super("Invalid authentication token", options);
    this.code = "INVALID_TOKEN";
  }
}

/**
 * Authorization Errors
 */
export class AuthorizationError extends BaseError {
  constructor(
    message: string = "Insufficient permissions",
    options?: {
      context?: Record<string, any>;
      userId?: string;
      requestId?: string;
      cause?: Error;
    }
  ) {
    super(message, 403, "AUTHORIZATION_ERROR", {
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      ...options,
    });
  }
}

export class ForbiddenResourceError extends AuthorizationError {
  constructor(
    resource: string,
    options?: { userId?: string; requestId?: string }
  ) {
    super(`Access to ${resource} is forbidden`, options);
    this.code = "FORBIDDEN_RESOURCE";
  }
}

/**
 * Validation Errors
 */
export class ValidationError extends BaseError {
  constructor(
    message: string,
    public readonly validationErrors?: Array<{
      field: string;
      message: string;
      value?: any;
    }>,
    options?: {
      context?: Record<string, any>;
      requestId?: string;
      cause?: Error;
    }
  ) {
    super(message, 400, "VALIDATION_ERROR", {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      context: {
        ...options?.context,
        validationErrors,
      },
      ...options,
    });
  }
}

/**
 * Database Errors
 */
export class DatabaseError extends BaseError {
  constructor(
    message: string,
    options?: {
      severity?: ErrorSeverity;
      context?: Record<string, any>;
      requestId?: string;
      cause?: Error;
    }
  ) {
    super(message, 500, "DATABASE_ERROR", {
      category: ErrorCategory.DATABASE,
      severity: options?.severity || ErrorSeverity.HIGH,
      isOperational: true,
      ...options,
    });
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(options?: { context?: Record<string, any>; cause?: Error }) {
    super("Failed to connect to database", {
      severity: ErrorSeverity.CRITICAL,
      ...options,
    });
    this.code = "DATABASE_CONNECTION_ERROR";
  }
}

export class DatabaseQueryError extends DatabaseError {
  constructor(
    query: string,
    options?: { context?: Record<string, any>; cause?: Error }
  ) {
    super("Database query failed", {
      context: { query, ...options?.context },
      ...options,
    });
    this.code = "DATABASE_QUERY_ERROR";
  }
}

export class DatabaseConstraintError extends DatabaseError {
  constructor(
    constraint: string,
    options?: { context?: Record<string, any>; cause?: Error }
  ) {
    super(`Database constraint violation: ${constraint}`, {
      severity: ErrorSeverity.MEDIUM,
      context: { constraint, ...options?.context },
      ...options,
    });
    this.code = "DATABASE_CONSTRAINT_ERROR";
  }
}

/**
 * Resource Errors
 */
export class ResourceError extends BaseError {
  constructor(
    message: string,
    statusCode: number,
    code: string,
    options?: {
      severity?: ErrorSeverity;
      context?: Record<string, any>;
      userId?: string;
      requestId?: string;
      cause?: Error;
    }
  ) {
    super(message, statusCode, code, {
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: options?.severity || ErrorSeverity.LOW,
      ...options,
    });
  }
}

export class NotFoundError extends ResourceError {
  constructor(
    resource: string,
    options?: {
      context?: Record<string, any>;
      userId?: string;
      requestId?: string;
    }
  ) {
    super(`${resource} not found`, 404, "NOT_FOUND", {
      context: { resource, ...options?.context },
      ...options,
    });
  }
}

export class ConflictError extends ResourceError {
  constructor(
    message: string,
    options?: {
      context?: Record<string, any>;
      userId?: string;
      requestId?: string;
    }
  ) {
    super(message, 409, "CONFLICT", options);
  }
}

export class AlreadyExistsError extends ConflictError {
  constructor(
    resource: string,
    options?: {
      context?: Record<string, any>;
      userId?: string;
      requestId?: string;
    }
  ) {
    super(`${resource} already exists`, {
      context: { resource, ...options?.context },
      ...options,
    });
    this.code = "ALREADY_EXISTS";
  }
}

/**
 * External Service Errors
 */
export class ExternalServiceError extends BaseError {
  constructor(
    service: string,
    message: string,
    options?: {
      severity?: ErrorSeverity;
      context?: Record<string, any>;
      requestId?: string;
      cause?: Error;
    }
  ) {
    super(message, 502, "EXTERNAL_SERVICE_ERROR", {
      category: ErrorCategory.EXTERNAL_SERVICE,
      severity: options?.severity || ErrorSeverity.HIGH,
      context: { service, ...options?.context },
      ...options,
    });
  }
}

export class ServiceUnavailableError extends ExternalServiceError {
  constructor(
    service: string,
    options?: { context?: Record<string, any>; cause?: Error }
  ) {
    super(service, `${service} is currently unavailable`, {
      severity: ErrorSeverity.HIGH,
      ...options,
    });
    this.code = "SERVICE_UNAVAILABLE";
  }
}

export class ServiceTimeoutError extends ExternalServiceError {
  constructor(
    service: string,
    timeout: number,
    options?: { context?: Record<string, any>; cause?: Error }
  ) {
    super(service, `${service} request timed out after ${timeout}ms`, {
      severity: ErrorSeverity.MEDIUM,
      context: { timeout, ...options?.context },
      ...options,
    });
    this.code = "SERVICE_TIMEOUT";
  }
}

/**
 * Rate Limiting Errors
 */
export class RateLimitError extends BaseError {
  constructor(
    message: string = "Rate limit exceeded",
    public readonly retryAfter?: number,
    options?: {
      context?: Record<string, any>;
      userId?: string;
      requestId?: string;
    }
  ) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", {
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.LOW,
      context: { retryAfter, ...options?.context },
      ...options,
    });
  }
}

/**
 * Business Logic Errors
 */
export class BusinessRuleError extends BaseError {
  constructor(
    message: string,
    options?: {
      context?: Record<string, any>;
      userId?: string;
      requestId?: string;
    }
  ) {
    super(message, 422, "BUSINESS_RULE_VIOLATION", {
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.LOW,
      ...options,
    });
  }
}

/**
 * System Errors
 */
export class SystemError extends BaseError {
  constructor(
    message: string,
    options?: {
      severity?: ErrorSeverity;
      context?: Record<string, any>;
      requestId?: string;
      cause?: Error;
    }
  ) {
    super(message, 500, "SYSTEM_ERROR", {
      category: ErrorCategory.SYSTEM,
      severity: options?.severity || ErrorSeverity.CRITICAL,
      isOperational: false,
      ...options,
    });
  }
}

/**
 * Error Handler Service
 */
export class ErrorHandler {
  /**
   * Handle operational errors
   */
  static handleOperationalError(error: BaseError): void {
    logger.error("Operational error occurred", error.toJSON());

    // Send alerts for high severity errors
    if (
      error.severity === ErrorSeverity.HIGH ||
      error.severity === ErrorSeverity.CRITICAL
    ) {
      this.sendAlert(error);
    }

    // Track error metrics
    this.trackError(error);
  }

  /**
   * Handle programming errors
   */
  static handleProgrammingError(error: Error): void {
    logger.error("Programming error occurred", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // Always alert on programming errors
    this.sendCriticalAlert(error);

    // In production, might want to restart the process
    if (process.env.NODE_ENV === "production") {
      logger.error("Shutting down due to programming error");
      process.exit(1);
    }
  }

  /**
   * Determine if error is operational
   */
  static isOperationalError(error: Error): boolean {
    if (error instanceof BaseError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Send alert for high severity errors
   */
  private static sendAlert(error: BaseError): void {
    // Implement your alerting mechanism
    // Examples: Slack, PagerDuty, Email, etc.
    logger.warn("Alert should be sent", {
      errorId: error.errorId,
      severity: error.severity,
      category: error.category,
    });
  }

  /**
   * Send critical alert
   */
  private static sendCriticalAlert(error: Error): void {
    logger.error("Critical alert should be sent", {
      error: error.message,
      stack: error.stack,
    });
  }

  /**
   * Track error metrics
   */
  private static trackError(error: BaseError): void {
    // Implement your metrics tracking
    // Examples: Prometheus, DataDog, New Relic, etc.
    logger.debug("Error tracked", {
      errorId: error.errorId,
      code: error.code,
      category: error.category,
      severity: error.severity,
    });
  }
}

/**
 * Error recovery strategies
 */
export class ErrorRecovery {
  /**
   * Retry with exponential backoff
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      baseDelay?: number;
      maxDelay?: number;
      onRetry?: (attempt: number, error: Error) => void;
    } = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries || 3;
    const baseDelay = options.baseDelay || 1000;
    const maxDelay = options.maxDelay || 10000;

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

          logger.debug("Retrying after error", {
            attempt: attempt + 1,
            maxRetries,
            delay,
            error: lastError.message,
          });

          if (options.onRetry) {
            options.onRetry(attempt + 1, lastError);
          }

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Circuit breaker pattern
   */
  static createCircuitBreaker<T>(
    fn: () => Promise<T>,
    options: {
      threshold?: number;
      timeout?: number;
      resetTimeout?: number;
    } = {}
  ) {
    let failures = 0;
    let lastFailureTime = 0;
    let state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

    const threshold = options.threshold || 5;
    const timeout = options.timeout || 60000;
    const resetTimeout = options.resetTimeout || 30000;

    return async (): Promise<T> => {
      // Check if circuit should reset
      if (state === "OPEN" && Date.now() - lastFailureTime > resetTimeout) {
        state = "HALF_OPEN";
        failures = 0;
        logger.info("Circuit breaker: HALF_OPEN");
      }

      // Reject if circuit is open
      if (state === "OPEN") {
        throw new SystemError("Circuit breaker is OPEN", {
          context: { failures, lastFailureTime },
        });
      }

      try {
        const result = await Promise.race([
          fn(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Circuit breaker timeout")),
              timeout
            )
          ),
        ]);

        // Success - reset if was half-open
        if (state === "HALF_OPEN") {
          state = "CLOSED";
          failures = 0;
          logger.info("Circuit breaker: CLOSED");
        }

        return result;
      } catch (error) {
        failures++;
        lastFailureTime = Date.now();

        if (failures >= threshold) {
          state = "OPEN";
          logger.error("Circuit breaker: OPEN", { failures, threshold });
        }

        throw error;
      }
    };
  }
}
