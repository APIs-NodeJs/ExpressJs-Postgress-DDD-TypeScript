// src/shared/middlewares/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../modules/auth/domain/services/TokenService';
import { ResponseHandler } from '../responses/ResponseHandler';
import { secureTokenExtractor } from '../infrastructure/auth/SecureTokenExtractor';
import {
  authAuditLogger,
  AuthEventType,
} from '../../modules/auth/infrastructure/AuthAuditLogger';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    workspaceId?: string;
  };
}

/**
 * Enhanced authentication middleware with:
 * - Secure token extraction
 * - Audit logging
 * - Better error handling
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  try {
    // Extract token using secure extractor
    const extractResult = secureTokenExtractor.extract(req);

    if (extractResult.isFailure) {
      // Log failed authentication attempt
      authAuditLogger.logAuthAttempt({
        type: AuthEventType.LOGIN_FAILURE,
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        success: false,
        failureReason: extractResult.getErrorValue(),
        metadata: {
          path: req.path,
          method: req.method,
        },
      });

      ResponseHandler.unauthorized(res, 'Authentication token is required', req.id);
      return;
    }

    const token = extractResult.getValue();

    // Verify token
    const verifyResult = TokenService.verifyAccessToken(token);

    if (verifyResult.isFailure) {
      // Log failed verification
      authAuditLogger.logAuthAttempt({
        type: AuthEventType.LOGIN_FAILURE,
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        success: false,
        failureReason: verifyResult.getErrorValue(),
        metadata: {
          path: req.path,
          method: req.method,
          tokenLength: token.length,
        },
      });

      ResponseHandler.unauthorized(
        res,
        'Invalid or expired authentication token',
        req.id
      );
      return;
    }

    // Extract payload
    const payload = verifyResult.getValue();

    // Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      workspaceId: payload.workspaceId,
    };

    // Log successful authentication (optional, can be noisy)
    if (process.env.LOG_AUTH_SUCCESS === 'true') {
      authAuditLogger.logAuthAttempt({
        type: AuthEventType.LOGIN_SUCCESS,
        userId: payload.userId,
        email: payload.email,
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        success: true,
        metadata: {
          path: req.path,
          method: req.method,
          duration: Date.now() - startTime,
        },
      });
    }

    next();
  } catch (error) {
    // Log unexpected error
    authAuditLogger.logAuthAttempt({
      type: AuthEventType.LOGIN_FAILURE,
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      success: false,
      failureReason: 'Unexpected authentication error',
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        path: req.path,
        method: req.method,
      },
    });

    ResponseHandler.unauthorized(res, 'Authentication failed', req.id);
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
export function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const extractResult = secureTokenExtractor.extract(req);

    if (extractResult.isFailure) {
      // No token present, continue without user
      return next();
    }

    const token = extractResult.getValue();
    const verifyResult = TokenService.verifyAccessToken(token);

    if (verifyResult.isSuccess) {
      const payload = verifyResult.getValue();
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        workspaceId: payload.workspaceId,
      };
    }

    next();
  } catch (error) {
    // On error, just continue without user
    next();
  }
}
