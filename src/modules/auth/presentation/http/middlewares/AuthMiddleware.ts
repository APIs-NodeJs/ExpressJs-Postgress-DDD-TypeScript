import { Request, Response, NextFunction } from "express";
import { JwtTokenService } from "../../../infrastructure/security/JwtTokenService";
import { ResponseHandler } from "../../../../../shared/responses/ResponseHandler";
import { logger } from "../../../../../shared/utils/logger";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    workspaceId: string;
  };
}

export class AuthMiddleware {
  constructor(private readonly tokenService: JwtTokenService) {}

  /**
   * Authenticate user - requires valid JWT token
   */
  authenticate() {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      try {
        const requestId = (req as any).id;
        const authHeader = req.headers.authorization;

        // Check if Authorization header exists
        if (!authHeader) {
          logger.warn("Authentication failed: Missing token", {
            path: req.path,
            ip: req.ip,
            requestId,
          });

          return ResponseHandler.unauthorized(
            res,
            "Authentication required",
            requestId
          );
        }

        // Check if it's a Bearer token
        if (!authHeader.startsWith("Bearer ")) {
          logger.warn("Authentication failed: Invalid token format", {
            path: req.path,
            ip: req.ip,
            requestId,
          });

          return ResponseHandler.error(
            res,
            401,
            "INVALID_TOKEN_FORMAT",
            "Authorization header must be in format: Bearer <token>",
            undefined,
            requestId
          );
        }

        // Extract token
        const token = authHeader.substring(7).trim();

        // Validate token is not empty
        if (!token) {
          logger.warn("Authentication failed: Empty token", {
            path: req.path,
            ip: req.ip,
            requestId,
          });

          return ResponseHandler.error(
            res,
            401,
            "EMPTY_TOKEN",
            "Token cannot be empty",
            undefined,
            requestId
          );
        }

        // Verify token
        const payload = this.tokenService.verifyAccessToken(token);

        if (!payload) {
          logger.warn("Authentication failed: Invalid token", {
            path: req.path,
            ip: req.ip,
            requestId,
          });

          return ResponseHandler.error(
            res,
            401,
            "INVALID_TOKEN",
            "Invalid or expired token",
            undefined,
            requestId
          );
        }

        // Validate payload has required fields
        if (!payload.userId || !payload.email || !payload.workspaceId) {
          logger.error("Authentication failed: Token missing required fields", {
            payload,
            path: req.path,
            requestId,
          });

          return ResponseHandler.error(
            res,
            401,
            "INVALID_TOKEN_PAYLOAD",
            "Token is malformed",
            undefined,
            requestId
          );
        }

        // Attach user to request
        req.user = {
          userId: payload.userId,
          email: payload.email,
          workspaceId: payload.workspaceId,
        };

        // Log successful authentication
        logger.debug("User authenticated", {
          userId: payload.userId,
          path: req.path,
          requestId,
        });

        next();
      } catch (error) {
        const requestId = (req as any).id;

        logger.error("Authentication error", {
          error: error instanceof Error ? error.message : "Unknown error",
          path: req.path,
          requestId,
        });

        return ResponseHandler.error(
          res,
          401,
          "AUTHENTICATION_ERROR",
          "Authentication failed",
          undefined,
          requestId
        );
      }
    };
  }

  /**
   * Optional authentication - continues without user if no token
   */
  optionalAuth() {
    return (
      req: AuthenticatedRequest,
      _res: Response,
      next: NextFunction
    ): void => {
      try {
        const requestId = (req as any).id;
        const authHeader = req.headers.authorization;

        // If no auth header, continue without user
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          next();
          return;
        }

        const token = authHeader.substring(7).trim();

        // If empty token, continue without user
        if (!token) {
          next();
          return;
        }

        // Try to verify token
        const payload = this.tokenService.verifyAccessToken(token);

        if (payload && payload.userId && payload.email && payload.workspaceId) {
          req.user = {
            userId: payload.userId,
            email: payload.email,
            workspaceId: payload.workspaceId,
          };

          logger.debug("Optional auth: User authenticated", {
            userId: payload.userId,
            path: req.path,
            requestId,
          });
        } else {
          logger.debug(
            "Optional auth: Invalid token, continuing without user",
            {
              path: req.path,
              requestId,
            }
          );
        }

        next();
      } catch (error) {
        const requestId = (req as any).id;

        // Log error but don't block request
        logger.debug("Optional auth error, continuing without user", {
          error: error instanceof Error ? error.message : "Unknown error",
          path: req.path,
          requestId,
        });

        next();
      }
    };
  }

  /**
   * Require specific workspace access
   */
  requireWorkspace(workspaceId: string) {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      const requestId = (req as any).id;

      if (!req.user) {
        return ResponseHandler.unauthorized(
          res,
          "Authentication required",
          requestId
        );
      }

      if (req.user.workspaceId !== workspaceId) {
        logger.warn("Workspace access denied", {
          userId: req.user.userId,
          requiredWorkspace: workspaceId,
          userWorkspace: req.user.workspaceId,
          path: req.path,
          requestId,
        });

        return ResponseHandler.forbidden(
          res,
          "Access to this workspace is not allowed",
          requestId
        );
      }

      next();
    };
  }

  /**
   * Require workspace access from params/body
   */
  requireWorkspaceAccess() {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      const requestId = (req as any).id;

      if (!req.user) {
        return ResponseHandler.unauthorized(
          res,
          "Authentication required",
          requestId
        );
      }

      const workspaceId = req.params.workspaceId || req.body.workspaceId;

      if (!workspaceId) {
        return ResponseHandler.badRequest(
          res,
          "Workspace ID is required",
          undefined,
          requestId
        );
      }

      if (req.user.workspaceId !== workspaceId) {
        logger.warn("Workspace access denied", {
          userId: req.user.userId,
          requestedWorkspace: workspaceId,
          userWorkspace: req.user.workspaceId,
          path: req.path,
          requestId,
        });

        return ResponseHandler.forbidden(
          res,
          "You do not have access to this workspace",
          requestId
        );
      }

      next();
    };
  }
}
