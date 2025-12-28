// src/shared/middlewares/workspaceAccess.ts
import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../responses/ResponseHandler';
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
      if (!req.user) {
        ResponseHandler.unauthorized(res, 'Authentication required', req.id);
        return;
      }

      const workspaceId = req.params.workspaceId || req.user.workspaceId;

      if (!workspaceId) {
        ResponseHandler.error(
          res,
          400,
          'BAD_REQUEST',
          'Workspace ID is required',
          undefined,
          req.id
        );
        return;
      }

      const workspace = await workspaceRepository.findById(workspaceId);

      if (!workspace) {
        ResponseHandler.notFound(res, 'Workspace', req.id);
        return;
      }

      const isOwner = workspace.isOwner(req.user.userId);
      const member = workspace.getMember(req.user.userId);

      if (!isOwner && !member) {
        ResponseHandler.forbidden(res, 'You are not a member of this workspace', req.id);
        return;
      }

      if (requiredPermissions && requiredPermissions.length > 0) {
        if (isOwner) {
          next();
          return;
        }

        if (!member) {
          ResponseHandler.forbidden(res, 'Access denied', req.id);
          return;
        }

        const hasAllPermissions = requiredPermissions.every(permission =>
          member.hasPermission(permission)
        );

        if (!hasAllPermissions) {
          ResponseHandler.forbidden(
            res,
            `Missing required permissions: ${requiredPermissions.join(', ')}`,
            req.id
          );
          return;
        }
      }

      req.workspace = workspace;
      req.workspaceMember = member;
      req.isWorkspaceOwner = isOwner;

      next();
    } catch (error) {
      console.error('Workspace access check error:', error);
      ResponseHandler.error(
        res,
        500,
        'INTERNAL_ERROR',
        'Failed to verify workspace access',
        undefined,
        req.id
      );
    }
  };
}

export function requireWorkspaceRole(...allowedRoles: WorkspaceRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        ResponseHandler.unauthorized(res, 'Authentication required', req.id);
        return;
      }

      const workspaceId = req.params.workspaceId || req.user.workspaceId;

      if (!workspaceId) {
        ResponseHandler.error(
          res,
          400,
          'BAD_REQUEST',
          'Workspace ID is required',
          undefined,
          req.id
        );
        return;
      }

      const workspace = await workspaceRepository.findById(workspaceId);

      if (!workspace) {
        ResponseHandler.notFound(res, 'Workspace', req.id);
        return;
      }

      const isOwner = workspace.isOwner(req.user.userId);

      if (isOwner && allowedRoles.includes(WorkspaceRole.OWNER)) {
        req.workspace = workspace;
        req.isWorkspaceOwner = true;
        next();
        return;
      }

      const member = workspace.getMember(req.user.userId);

      if (!member) {
        ResponseHandler.forbidden(res, 'You are not a member of this workspace', req.id);
        return;
      }

      const hasRole = allowedRoles.includes(member.role);

      if (!hasRole) {
        ResponseHandler.forbidden(
          res,
          `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          req.id
        );
        return;
      }

      req.workspace = workspace;
      req.workspaceMember = member;
      req.isWorkspaceOwner = false;

      next();
    } catch (error) {
      console.error('Workspace role check error:', error);
      ResponseHandler.error(
        res,
        500,
        'INTERNAL_ERROR',
        'Failed to verify workspace role',
        undefined,
        req.id
      );
    }
  };
}
