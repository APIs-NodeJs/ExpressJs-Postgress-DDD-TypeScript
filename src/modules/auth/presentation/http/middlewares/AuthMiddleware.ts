import { Request, Response, NextFunction } from "express";
import { JwtTokenService } from "../../../infrastructure/security/JwtTokenService";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    workspaceId: string;
  };
}

export class AuthMiddleware {
  constructor(private readonly tokenService: JwtTokenService) {}

  authenticate() {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      const token = authHeader.substring(7);
      const payload = this.tokenService.verifyAccessToken(token);

      if (!payload) {
        res.status(401).json({
          success: false,
          error: "Invalid or expired token",
        });
        return;
      }

      req.user = {
        userId: payload.userId,
        email: payload.email!,
        workspaceId: payload.workspaceId!,
      };

      next();
    };
  }

  optionalAuth() {
    return (
      req: AuthenticatedRequest,
      _res: Response,
      next: NextFunction
    ): void => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        next();
        return;
      }

      const token = authHeader.substring(7);
      const payload = this.tokenService.verifyAccessToken(token);

      if (payload) {
        req.user = {
          userId: payload.userId,
          email: payload.email!,
          workspaceId: payload.workspaceId!,
        };
      }

      next();
    };
  }
}
