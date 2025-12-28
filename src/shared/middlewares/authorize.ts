// src/shared/middlewares/authorize.ts
import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../responses/ResponseHandler';
import { UserRole } from '../../modules/users/domain/valueObjects/UserRole';

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseHandler.unauthorized(res, 'Authentication required', req.id);
      return;
    }

    const hasRole = allowedRoles.includes(req.user.role as UserRole);

    if (!hasRole) {
      ResponseHandler.forbidden(
        res,
        'Insufficient permissions. Required roles: ' + allowedRoles.join(', '),
        req.id
      );
      return;
    }

    next();
  };
}
