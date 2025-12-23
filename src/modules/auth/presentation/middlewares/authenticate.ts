import { Request, Response, NextFunction } from "express";
import {
  JwtService,
  JwtPayload,
} from "@modules/auth/infrastructure/security/JwtService";
import { ApiResponse } from "@infrastructure/http/responses/ApiResponse";
import { AppRoleType } from "@modules/auth/domain/value-objects/AppRole";

export interface AuthRequest extends Request {
  user?: JwtPayload;
  userRole?: AppRoleType;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return ApiResponse.unauthorized(res, "No token provided");
    }

    const token = authHeader.substring(7);

    try {
      const decoded = JwtService.verifyAccessToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      return ApiResponse.unauthorized(res, "Invalid or expired token");
    }
  } catch (error) {
    return ApiResponse.internalError(res);
  }
};
