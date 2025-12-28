import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      id: string;
      correlationId: string;
      user?: {
        id: string;
        email: string;
        roles: string[];
      };
    }
  }
}

export {};
