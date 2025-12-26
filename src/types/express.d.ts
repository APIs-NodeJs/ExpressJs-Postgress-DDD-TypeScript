declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: {
        userId: string;
        email: string;
        workspaceId: string;
      };
    }
  }
}

export {};
