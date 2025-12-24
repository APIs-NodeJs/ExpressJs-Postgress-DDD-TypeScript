import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../shared/domain/AppError";
import {
  Permission,
  PermissionChecker,
  Role,
} from "../../../modules/auth/domain/value-objects/Permission";
import { Logger } from "../../../shared/infrastructure/logger/logger";

/**
 * Middleware to check if user has required role(s)
 */
export function authorizeRoles(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw AppError.unauthorized("Authentication required");
      }

      // Check if user has one of the allowed roles
      const userRole = req.user.role as Role;
      if (!allowedRoles.includes(userRole)) {
        Logger.security("Authorization failed - insufficient role", {
          userId: req.user.userId,
          userRole,
          requiredRoles: allowedRoles,
          path: req.path,
        });
        throw AppError.forbidden(
          "You do not have permission to access this resource"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user has required permission(s)
 */
export function authorizePermissions(requiredPermissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw AppError.unauthorized("Authentication required");
      }

      // Get user role
      const userRole = req.user.role as Role;

      // Check if user has all required permissions
      const hasPermission = PermissionChecker.hasAllPermissions(
        userRole,
        requiredPermissions
      );

      if (!hasPermission) {
        Logger.security("Authorization failed - insufficient permissions", {
          userId: req.user.userId,
          userRole,
          requiredPermissions,
          path: req.path,
        });
        throw AppError.forbidden(
          "You do not have permission to perform this action"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user has ANY of the required permissions
 */
export function authorizeAnyPermission(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw AppError.unauthorized("Authentication required");
      }

      const userRole = req.user.role as Role;
      const hasPermission = PermissionChecker.hasAnyPermission(
        userRole,
        permissions
      );

      if (!hasPermission) {
        Logger.security("Authorization failed - no matching permissions", {
          userId: req.user.userId,
          userRole,
          requiredPermissions: permissions,
          path: req.path,
        });
        throw AppError.forbidden(
          "You do not have permission to perform this action"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user owns the resource
 */
export function authorizeOwnership(resourceIdParam: string = "id") {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw AppError.unauthorized("Authentication required");
      }

      const resourceId = req.params[resourceIdParam];
      const userId = req.user.userId;

      // Owner and Admin can bypass ownership check
      const userRole = req.user.role as Role;
      if (userRole === "owner" || userRole === "admin") {
        return next();
      }

      // Check if user owns the resource
      if (resourceId !== userId) {
        Logger.security("Authorization failed - not resource owner", {
          userId,
          resourceId,
          path: req.path,
        });
        throw AppError.forbidden("You can only access your own resources");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
