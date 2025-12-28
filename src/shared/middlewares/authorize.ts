// src/shared/middlewares/authorize.ts
import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../responses/ResponseHandler';
import { UserRole } from '../../modules/users/domain/valueObjects/UserRole';
import { AuthenticatedRequest } from './authenticate';

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      ResponseHandler.unauthorized(res, 'Authentication required', (req as any).id);
      return;
    }

    const hasRole = allowedRoles.includes(authReq.user.role as UserRole);

    if (!hasRole) {
      ResponseHandler.forbidden(
        res,
        'Insufficient permissions. Required roles: ' + allowedRoles.join(', '),
        (req as any).id
      );
      return;
    }

    next();
  };
}
