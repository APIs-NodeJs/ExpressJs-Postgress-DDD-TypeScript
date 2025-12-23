import { Response, NextFunction } from "express";
import { AuthRequest } from "./authenticate";
import { ApiResponse } from "@infrastructure/http/responses/ApiResponse";
import { UserRoleRepository } from "@modules/auth/infrastructure/persistence/repositories/UserRoleRepository";
import { AppRoleType } from "@modules/auth/domain/value-objects/AppRole";

const userRoleRepository = new UserRoleRepository();

export const checkRole = (...allowedRoles: AppRoleType[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return ApiResponse.unauthorized(res, "Authentication required");
      }

      // Get user role from database
      const userRole = await userRoleRepository.findByUserId(userId);

      if (!userRole) {
        // If no role found, assign default 'user' role
        return ApiResponse.forbidden(
          res,
          `Access denied. Required role: ${allowedRoles.join(" or ")}`
        );
      }

      // Check if user has one of the allowed roles
      if (!allowedRoles.includes(userRole.role.value)) {
        return ApiResponse.forbidden(
          res,
          `Access denied. Required role: ${allowedRoles.join(" or ")}`
        );
      }

      // Attach role to request for use in controllers
      req.userRole = userRole.role.value;
      next();
    } catch (error) {
      console.error("Role check error:", error);
      return ApiResponse.internalError(res);
    }
  };
};
