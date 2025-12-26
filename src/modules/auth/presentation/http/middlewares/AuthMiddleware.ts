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
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      const token = authHeader.substring(7);
      const payload = this.tokenService.verifyAccessToken(token);

      if (!payload) {
        return res.status(401).json({
          success: false,
          error: "Invalid or expired token",
        });
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
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
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
