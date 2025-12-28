// src/shared/types/express.d.ts
declare namespace Express {
  interface Request {
    id: string;
    correlationId?: string;
    user?: {
      userId: string;
      email: string;
      role: string;
      workspaceId?: string;
    };
    workspace?: any;
    workspaceMember?: any;
    isWorkspaceOwner?: boolean;
  }
}

export {};
