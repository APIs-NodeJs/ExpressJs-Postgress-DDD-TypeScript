// src/shared/types/express.d.ts
import { Workspace } from '../../modules/workspaces/domain/entities/Workspace';
import { WorkspaceMember } from '../../modules/workspaces/domain/entities/WorkspaceMember';

declare global {
  namespace Express {
    interface Request {
      id: string;
      correlationId?: string;
      user?: {
        userId: string;
        email: string;
        role: string;
        workspaceId?: string;
      };
      workspace?: Workspace;
      workspaceMember?: WorkspaceMember;
      isWorkspaceOwner?: boolean;
    }
  }
}

export {};
