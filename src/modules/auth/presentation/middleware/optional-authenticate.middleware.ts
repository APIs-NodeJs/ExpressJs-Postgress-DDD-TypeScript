// src/modules/auth/presentation/middleware/optional-authenticate.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '@core/utils';

export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      return next();
    }

    try {
      const decoded = JwtUtil.verifyAccessToken(token);

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      // Silently ignore errors for optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
}
