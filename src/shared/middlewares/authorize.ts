import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '@/shared/infrastructure/http/ResponseHandler';

export function authorize(...requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseHandler.unauthorized(res);
      return;
    }

    const hasRole = requiredRoles.some(role => req.user!.roles.includes(role));

    if (!hasRole) {
      ResponseHandler.forbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
}
