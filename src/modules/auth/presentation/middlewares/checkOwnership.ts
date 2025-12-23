import { Response, NextFunction } from "express";
import { AuthRequest } from "./authenticate";
import { ApiResponse } from "@infrastructure/http/responses/ApiResponse";
import { UserRoleRepository } from "@modules/auth/infrastructure/persistence/repositories/UserRoleRepository";

const userRoleRepository = new UserRoleRepository();

export const checkOwnership = (
  resourceType: string,
  getResourceOwnerId: (req: AuthRequest) => Promise<string | null>
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return ApiResponse.unauthorized(res);
      }

      // Get user role
      const userRole = await userRoleRepository.findByUserId(userId);

      // Admins and moderators can access any resource
      if (
        userRole &&
        (userRole.role.isAdmin() || userRole.role.isModerator())
      ) {
        return next();
      }

      // Check if user owns the resource
      const resourceOwnerId = await getResourceOwnerId(req);

      if (!resourceOwnerId) {
        return ApiResponse.notFound(res, `${resourceType} not found`);
      }

      if (resourceOwnerId !== userId) {
        return ApiResponse.forbidden(
          res,
          "You can only modify your own resources"
        );
      }

      next();
    } catch (error) {
      console.error("Ownership check error:", error);
      return ApiResponse.internalError(res);
    }
  };
};
