import { Request, Response, NextFunction } from "express";
import { TokenService } from "../../../modules/auth/infrastructure/security/TokenService";
import { AppError } from "../../../shared/domain/AppError";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        workspaceId: string;
        email: string;
        role: string; // ✅ ADDED: Include role in request
      };
    }
  }
}

const tokenService = new TokenService();

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw AppError.unauthorized("No token provided");
    }

    const token = authHeader.substring(7);
    const payload = tokenService.verifyAccessToken(token);

    // ✅ UPDATED: Include role in request user
    req.user = {
      userId: payload.userId,
      workspaceId: payload.workspaceId,
      email: payload.email,
      role: payload.role, // Added role
    };

    next();
  } catch (error) {
    next(AppError.unauthorized("Invalid token"));
  }
}
