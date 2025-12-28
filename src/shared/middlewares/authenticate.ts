// src/shared/middlewares/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../modules/auth/domain/services/TokenService';
import { ResponseHandler } from '../responses/ResponseHandler';

// Export this interface for use in other files
export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    workspaceId?: string;
  };
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);
    if (!token) {
      ResponseHandler.unauthorized(res, 'Missing authentication token', req.id);
      return;
    }

    const verifyResult = TokenService.verifyAccessToken(token);
    if (verifyResult.isFailure) {
      ResponseHandler.unauthorized(res, verifyResult.getErrorValue(), req.id);
      return;
    }

    const payload = verifyResult.getValue();
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      workspaceId: payload.workspaceId,
    };

    next();
  } catch (error) {
    ResponseHandler.unauthorized(res, 'Invalid or expired token', req.id);
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
