// src/modules/workspace/presentation/middleware/workspace-context.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { WorkspaceContainer } from '../../workspace.container';

declare global {
  namespace Express {
    interface Request {
      workspaceId?: string;
      workspaceMembership?: {
        workspaceId: string;
        role: string;
        canManage: boolean;
        canEdit: boolean;
      };
    }
  }
}

/**
 * Middleware to set workspace context from header or query parameter
 * This is useful for multi-tenant API calls where workspace context is needed
 */
export async function workspaceContext(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      return next();
    }

    // Get workspace ID from header or query
    const workspaceId =
      (req.headers['x-workspace-id'] as string) || (req.query.workspaceId as string);

    if (!workspaceId) {
      return next();
    }

    // Verify user is a member of the workspace
    const memberRepository = WorkspaceContainer.getMemberRepository();
    const member = await memberRepository.findByWorkspaceAndUser(workspaceId, req.user.userId);

    if (!member) {
      return next();
    }

    // Set workspace context
    req.workspaceId = workspaceId;
    req.workspaceMembership = {
      workspaceId,
      role: member.getRole().getValue(),
      canManage: member.canManageMembers(),
      canEdit: member.canEditWorkspace(),
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to require workspace context
 * This ensures that a valid workspace context is set before proceeding
 */
export function requireWorkspaceContext(req: Request, res: Response, next: NextFunction): void {
  if (!req.workspaceId || !req.workspaceMembership) {
    return next(new Error('Workspace context is required. Please provide X-Workspace-ID header.'));
  }
  next();
}
