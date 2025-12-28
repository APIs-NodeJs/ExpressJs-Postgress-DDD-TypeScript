import { Request, Response, NextFunction } from 'express';
import { jwtService } from '@/shared/infrastructure/auth/JwtService';
import { ResponseHandler } from '@/shared/infrastructure/http/ResponseHandler';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);
    if (!token) {
      ResponseHandler.unauthorized(res, 'Missing authentication token');
      return;
    }

    const payload = jwtService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    ResponseHandler.unauthorized(res, 'Invalid or expired token');
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
