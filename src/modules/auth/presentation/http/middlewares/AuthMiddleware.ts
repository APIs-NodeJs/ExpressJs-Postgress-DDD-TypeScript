import { Request, Response, NextFunction } from "express";
import { JwtTokenService } from "../../../infrastructure/security/JwtTokenService";
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

  authenticate() {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      try {
        const authHeader = req.headers.authorization;

        // Check if Authorization header exists
        if (!authHeader) {
          res.status(401).json({
            success: false,
            error: {
              code: "MISSING_TOKEN",
              message: "Authentication required",
            },
            requestId: (req as any).id,
          });
          return;
        }

        // Check if it's a Bearer token
        if (!authHeader.startsWith("Bearer ")) {
          res.status(401).json({
            success: false,
            error: {
              code: "INVALID_TOKEN_FORMAT",
              message: "Authorization header must be in format: Bearer <token>",
            },
            requestId: (req as any).id,
          });
          return;
        }

        // Extract token
        const token = authHeader.substring(7).trim();

        // Validate token is not empty
        if (!token) {
          res.status(401).json({
            success: false,
            error: {
              code: "EMPTY_TOKEN",
              message: "Token cannot be empty",
            },
            requestId: (req as any).id,
          });
          return;
        }

        // Verify token
        const payload = this.tokenService.verifyAccessToken(token);

        if (!payload) {
          logger.warn("Invalid token attempt", {
            ip: req.ip,
            path: req.path,
            requestId: (req as any).id,
          });

          res.status(401).json({
            success: false,
            error: {
              code: "INVALID_TOKEN",
              message: "Invalid or expired token",
            },
            requestId: (req as any).id,
          });
          return;
        }

        // Validate payload has required fields
        if (!payload.userId || !payload.email || !payload.workspaceId) {
          logger.error("Token missing required fields", {
            payload,
            requestId: (req as any).id,
          });

          res.status(401).json({
            success: false,
            error: {
              code: "INVALID_TOKEN_PAYLOAD",
              message: "Token is malformed",
            },
            requestId: (req as any).id,
          });
          return;
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
          requestId: (req as any).id,
        });

        next();
      } catch (error) {
        logger.error("Authentication error", {
          error: error instanceof Error ? error.message : "Unknown error",
          path: req.path,
          requestId: (req as any).id,
        });

        res.status(401).json({
          success: false,
          error: {
            code: "AUTHENTICATION_ERROR",
            message: "Authentication failed",
          },
          requestId: (req as any).id,
        });
      }
    };
  }

  optionalAuth() {
    return (
      req: AuthenticatedRequest,
      _res: Response,
      next: NextFunction
    ): void => {
      try {
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
            requestId: (req as any).id,
          });
        } else {
          logger.debug(
            "Optional auth: Invalid token, continuing without user",
            {
              path: req.path,
              requestId: (req as any).id,
            }
          );
        }

        next();
      } catch (error) {
        // Log error but don't block request
        logger.debug("Optional auth error, continuing without user", {
          error: error instanceof Error ? error.message : "Unknown error",
          path: req.path,
          requestId: (req as any).id,
        });

        next();
      }
    };
  }

  // NEW: Middleware to require specific workspace
  requireWorkspace(workspaceId: string) {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication required",
          },
          requestId: (req as any).id,
        });
        return;
      }

      if (req.user.workspaceId !== workspaceId) {
        logger.warn("Workspace access denied", {
          userId: req.user.userId,
          requiredWorkspace: workspaceId,
          userWorkspace: req.user.workspaceId,
          requestId: (req as any).id,
        });

        res.status(403).json({
          success: false,
          error: {
            code: "WORKSPACE_ACCESS_DENIED",
            message: "Access to this workspace is not allowed",
          },
          requestId: (req as any).id,
        });
        return;
      }

      next();
    };
  }

  // NEW: Middleware to check if user belongs to workspace in params
  requireWorkspaceAccess() {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication required",
          },
          requestId: (req as any).id,
        });
        return;
      }

      const workspaceId = req.params.workspaceId || req.body.workspaceId;

      if (!workspaceId) {
        res.status(400).json({
          success: false,
          error: {
            code: "WORKSPACE_ID_REQUIRED",
            message: "Workspace ID is required",
          },
          requestId: (req as any).id,
        });
        return;
      }

      if (req.user.workspaceId !== workspaceId) {
        logger.warn("Workspace access denied", {
          userId: req.user.userId,
          requestedWorkspace: workspaceId,
          userWorkspace: req.user.workspaceId,
          requestId: (req as any).id,
        });

        res.status(403).json({
          success: false,
          error: {
            code: "WORKSPACE_ACCESS_DENIED",
            message: "You do not have access to this workspace",
          },
          requestId: (req as any).id,
        });
        return;
      }

      next();
    };
  }

  // NEW: Rate limiting per user
  userRateLimit(maxRequests: number, windowMs: number) {
    const userRequests = new Map<
      string,
      { count: number; resetTime: number }
    >();

    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      if (!req.user) {
        next();
        return;
      }

      const userId = req.user.userId;
      const now = Date.now();
      const userRecord = userRequests.get(userId);

      // Clean up old records
      if (userRecord && now > userRecord.resetTime) {
        userRequests.delete(userId);
      }

      // Get or create user record
      const record = userRequests.get(userId) || {
        count: 0,
        resetTime: now + windowMs,
      };

      // Increment count
      record.count++;
      userRequests.set(userId, record);

      // Check if limit exceeded
      if (record.count > maxRequests) {
        logger.warn("User rate limit exceeded", {
          userId,
          count: record.count,
          maxRequests,
          requestId: (req as any).id,
        });

        res.status(429).json({
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests, please try again later",
          },
          requestId: (req as any).id,
        });
        return;
      }

      next();
    };
  }
}
