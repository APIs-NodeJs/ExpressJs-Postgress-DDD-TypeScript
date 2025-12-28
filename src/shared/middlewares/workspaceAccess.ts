// src/shared/middlewares/workspaceAccess.ts
import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../responses/ResponseHandler';
import { AuthenticatedRequest } from './authenticate';
import { WorkspaceRepository } from '../../modules/workspaces/infrastructure/persistence/repositories/WorkspaceRepository';
import { SequelizeUnitOfWork } from '../../core/infrastructure/persistence/SequelizeUnitOfWork';
import { sequelize } from '../config/database.config';
import { Permission } from '../../modules/workspaces/domain/valueObjects/Permission';
import { WorkspaceRole } from '../../modules/workspaces/domain/valueObjects/WorkspaceRole';

const unitOfWork = new SequelizeUnitOfWork(sequelize);
const workspaceRepository = new WorkspaceRepository(unitOfWork);

export function requireWorkspaceAccess(requiredPermissions?: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        ResponseHandler.unauthorized(res, 'Authentication required', (req as any).id);
        return;
      }

      const workspaceId = req.params.workspaceId || authReq.user.workspaceId;

      if (!workspaceId) {
        ResponseHandler.error(
          res,
          400,
          'BAD_REQUEST',
          'Workspace ID is required',
          undefined,
          (req as any).id
        );
        return;
      }

      const workspace = await workspaceRepository.findById(workspaceId);

      if (!workspace) {
        ResponseHandler.notFound(res, 'Workspace', (req as any).id);
        return;
      }

      const isOwner = workspace.isOwner(authReq.user.userId);
      const member = workspace.getMember(authReq.user.userId);

      if (!isOwner && !member) {
        ResponseHandler.forbidden(
          res,
          'You are not a member of this workspace',
          (req as any).id
        );
        return;
      }

      if (requiredPermissions && requiredPermissions.length > 0) {
        if (isOwner) {
          next();
          return;
        }

        if (!member) {
          ResponseHandler.forbidden(res, 'Access denied', (req as any).id);
          return;
        }

        const hasAllPermissions = requiredPermissions.every(permission =>
          member.hasPermission(permission)
        );

        if (!hasAllPermissions) {
          ResponseHandler.forbidden(
            res,
            `Missing required permissions: ${requiredPermissions.join(', ')}`,
            (req as any).id
          );
          return;
        }
      }

      (req as any).workspace = workspace;
      (req as any).workspaceMember = member;
      (req as any).isWorkspaceOwner = isOwner;

      next();
    } catch (error) {
      console.error('Workspace access check error:', error);
      ResponseHandler.error(
        res,
        500,
        'INTERNAL_ERROR',
        'Failed to verify workspace access',
        undefined,
        (req as any).id
      );
    }
  };
}

export function requireWorkspaceRole(...allowedRoles: WorkspaceRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      if (!authReq.user) {
        ResponseHandler.unauthorized(res, 'Authentication required', (req as any).id);
        return;
      }

      const workspaceId = req.params.workspaceId || authReq.user.workspaceId;

      if (!workspaceId) {
        ResponseHandler.error(
          res,
          400,
          'BAD_REQUEST',
          'Workspace ID is required',
          undefined,
          (req as any).id
        );
        return;
      }

      const workspace = await workspaceRepository.findById(workspaceId);

      if (!workspace) {
        ResponseHandler.notFound(res, 'Workspace', (req as any).id);
        return;
      }

      const isOwner = workspace.isOwner(authReq.user.userId);

      if (isOwner && allowedRoles.includes(WorkspaceRole.OWNER)) {
        (req as any).workspace = workspace;
        (req as any).isWorkspaceOwner = true;
        next();
        return;
      }

      const member = workspace.getMember(authReq.user.userId);

      if (!member) {
        ResponseHandler.forbidden(
          res,
          'You are not a member of this workspace',
          (req as any).id
        );
        return;
      }

      const hasRole = allowedRoles.includes(member.role);

      if (!hasRole) {
        ResponseHandler.forbidden(
          res,
          `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          (req as any).id
        );
        return;
      }

      (req as any).workspace = workspace;
      (req as any).workspaceMember = member;
      (req as any).isWorkspaceOwner = false;

      next();
    } catch (error) {
      console.error('Workspace role check error:', error);
      ResponseHandler.error(
        res,
        500,
        'INTERNAL_ERROR',
        'Failed to verify workspace role',
        undefined,
        (req as any).id
      );
    }
  };
}

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      workspace?: any;
      workspaceMember?: any;
      isWorkspaceOwner?: boolean;
    }
  }
}
