import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../../modules/auth/infrastructure/security/TokenService';
import { AppError } from '../../../shared/domain/AppError';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        workspaceId: string;
        email: string;
      };
    }
  }
}

const tokenService = new TokenService();

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = tokenService.verifyAccessToken(token);

    req.user = payload;
    next();
  } catch (error) {
    next(AppError.unauthorized('Invalid or expired token'));
  }
}

export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = tokenService.verifyAccessToken(token);
      req.user = payload;
    }
  } catch {
    // Token invalid, but it's optional so continue
  }
  
  next();
}
