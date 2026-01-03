// src/modules/auth/presentation/middleware/authenticate.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, TokenExpiredError, TokenInvalidError } from '@core/errors';
import { JwtUtil } from '@core/utils';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('Authorization header is missing');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid authorization format. Use Bearer token');
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new UnauthorizedError('Token is missing');
    }

    try {
      const decoded = JwtUtil.verifyAccessToken(token);

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };

      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedError('Access token has expired');
      }
      if (error instanceof TokenInvalidError) {
        throw new UnauthorizedError('Invalid access token');
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
}
