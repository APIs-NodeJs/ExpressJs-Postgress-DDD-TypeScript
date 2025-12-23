
export abstract class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// Authentication Errors
export class AuthenticationError extends DomainError {
  constructor(message: string = 'Authentication failed') {
    super('AUTHENTICATION_FAILED', message, 401);
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('Invalid email or password');
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor() {
    super('Token has expired');
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor() {
    super('Invalid token provided');
  }
}

// Authorization Errors
export class AuthorizationError extends DomainError {
  constructor(message: string = 'Insufficient permissions') {
    super('AUTHORIZATION_FAILED', message, 403);
  }
}

export class InsufficientPermissionsError extends AuthorizationError {
  constructor(requiredPermission: string) {
    super(`Permission required: ${requiredPermission}`);
  }
}

// Validation Errors
export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, string[]>) {
    super('VALIDATION_FAILED', message, 400, details);
  }
}

export class InvalidEmailError extends ValidationError {
  constructor() {
    super('Invalid email format');
  }
}

export class WeakPasswordError extends ValidationError {
  constructor() {
    super('Password does not meet security requirements', {
      password: [
        'Must be at least 8 characters',
        'Must contain uppercase letter',
        'Must contain lowercase letter',
        'Must contain number'
      ]
    });
  }
}

// Business Logic Errors
export class BusinessRuleViolationError extends DomainError {
  constructor(message: string) {
    super('BUSINESS_RULE_VIOLATION', message, 422);
  }
}

export class DuplicateResourceError extends BusinessRuleViolationError {
  constructor(resource: string, field: string) {
    super(`${resource} with this ${field} already exists`);
  }
}

// Resource Errors
export class ResourceNotFoundError extends DomainError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super('RESOURCE_NOT_FOUND', message, 404);
  }
}

// Rate Limiting
export class RateLimitExceededError extends DomainError {
  constructor(retryAfter?: number) {
    super('RATE_LIMIT_EXCEEDED', 'Too many requests', 429, {
      retryAfter: retryAfter || 60
    });
  }
}

// Infrastructure Errors
export class InfrastructureError extends DomainError {
  constructor(message: string, details?: Record<string, any>) {
    super('INFRASTRUCTURE_ERROR', message, 500, details);
  }
}

export class DatabaseError extends InfrastructureError {
  constructor(operation: string, error: Error) {
    super(`Database ${operation} failed`, {
      originalError: error.message,
      stack: error.stack
    });
  }
}

export class CacheError extends InfrastructureError {
  constructor(operation: string) {
    super(`Cache ${operation} failed`);
  }
}

// src/infrastructure/http/middlewares/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { DomainError } from '@shared/domain/errors/DomainErrors';
import { logger } from '@infrastructure/logging/logger';

export class ErrorHandler {
  static handle(err: Error, req: Request, res: Response, next: NextFunction) {
    const requestId = res.locals.requestId || 'unknown';

    // Log error with context
    logger.error('Request error', {
      requestId,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: (req as any).user?.userId,
      },
    });

    // Handle domain errors
    if (err instanceof DomainError) {
      return res.status(err.statusCode).json({
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
          requestId,
        },
      });
    }

    // Handle Sequelize errors
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_RESOURCE',
          message: 'Resource already exists',
          requestId,
        },
      });
    }

    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Validation failed',
          details: (err as any).errors?.map((e: any) => ({
            field: e.path,
            message: e.message,
          })),
          requestId,
        },
      });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
          requestId,
        },
      });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
          requestId,
        },
      });
    }

    // Default error response
    const statusCode = (err as any).statusCode || 500;
    const isDevelopment = process.env.NODE_ENV === 'development';

    res.status(statusCode).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: isDevelopment ? err.message : 'An unexpected error occurred',
        ...(isDevelopment && { stack: err.stack }),
        requestId,
      },
    });
  }
}

// Usage in use cases
// src/modules/auth/application/use-cases/LoginUseCase.ts (Updated)

import { 
  InvalidCredentialsError,
  InvalidEmailError 
} from '@shared/domain/errors/DomainErrors';

export class LoginUseCase implements UseCase<LoginRequest, Result<AuthResponseDto>> {
  constructor(private userRepository: IUserRepository) {}

  async execute(request: LoginRequest): Promise<Result<AuthResponseDto>> {
    // Validate email
    const emailOrError = Email.create(request.email);
    if (emailOrError.isFailure) {
      throw new InvalidEmailError();
    }

    const email = emailOrError.getValue();
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatch = await PasswordHasher.compare(
      request.password,
      user.password.value
    );

    if (!passwordMatch) {
      throw new InvalidCredentialsError();
    }

    // Generate tokens and return response
    const tokens = JwtService.generateTokens({
      userId: user.id,
      workspaceId: user.workspaceId,
      email: user.email.value,
    });

    return Result.ok({
      user: {
        id: user.id,
        email: user.email.value,
        name: user.name,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        workspaceId: user.workspaceId,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      tokens,
    });
  }
}