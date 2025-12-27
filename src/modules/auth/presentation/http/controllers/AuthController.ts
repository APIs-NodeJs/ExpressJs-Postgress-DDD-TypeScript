// src/modules/auth/presentation/http/controllers/AuthController.ts
import { Request, Response, NextFunction } from "express";
import { AuthApplicationService } from "../../../application/services/AuthApplicationService";
import { ResponseHandler } from "../../../../../shared/responses/ResponseHandler";
import { logger } from "../../../../../shared/utils/logger";

interface AuthenticatedRequest extends Request {
  id: string;
  user: {
    userId: string;
    email: string;
    workspaceId: string;
  };
}

export class AuthController {
  constructor(private readonly authService: AuthApplicationService) {}

  /**
   * Sign up new user
   * POST /api/auth/signup
   */
  signUp = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password, firstName, lastName } = req.body;
      const extReq = req as AuthenticatedRequest;

      const result = await this.authService.signUp(
        email,
        password,
        firstName,
        lastName
      );

      if (result.isFailure) {
        logger.warn("Signup failed", {
          email,
          error: result.error,
          requestId: extReq.id,
        });

        return ResponseHandler.badRequest(
          res,
          result.error!,
          undefined,
          extReq.id
        );
      }

      const data = result.getValue();

      logger.info("User signup successful", {
        userId: data.userId,
        email: data.email,
        requestId: extReq.id,
      });

      ResponseHandler.created(
        res,
        {
          userId: data.userId,
          workspaceId: data.workspaceId,
          email: data.email,
        },
        "User created successfully",
        extReq.id
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login user
   * POST /api/auth/login
   */
  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;
      const extReq = req as AuthenticatedRequest;
      const ipAddress = req.ip;

      const result = await this.authService.login(email, password, ipAddress);

      if (result.isFailure) {
        logger.warn("Login failed", {
          email,
          error: result.error,
          ipAddress,
          requestId: extReq.id,
        });

        return ResponseHandler.unauthorized(res, result.error!, extReq.id);
      }

      const data = result.getValue();

      logger.info("User login successful", {
        userId: data.userId,
        email: data.email,
        ipAddress,
        requestId: extReq.id,
      });

      ResponseHandler.ok(
        res,
        {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: {
            id: data.userId,
            email: data.email,
          },
          expiresIn: data.expiresIn,
        },
        "Login successful",
        extReq.id
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user profile
   * GET /api/auth/profile
   */
  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const extReq = req as AuthenticatedRequest;
      const userId = extReq.user.userId;

      const result = await this.authService.getUser(userId);

      if (result.isFailure) {
        logger.warn("Get profile failed", {
          userId,
          error: result.error,
          requestId: extReq.id,
        });

        return ResponseHandler.notFound(res, "User", extReq.id);
      }

      const user = result.getValue();

      logger.debug("Profile retrieved", {
        userId: user.id,
        requestId: extReq.id,
      });

      ResponseHandler.ok(
        res,
        {
          id: user.id,
          email: user.email,
          workspaceId: user.workspaceId,
          status: user.status,
          emailVerified: user.emailVerified,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName:
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : undefined,
          createdAt: user.createdAt,
        },
        "Profile retrieved successfully",
        extReq.id
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user profile
   * PATCH /api/auth/profile
   */
  updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const extReq = req as AuthenticatedRequest;
      const userId = extReq.user.userId;
      const { firstName, lastName } = req.body;

      // Get user
      const userResult = await this.authService.getUser(userId);

      if (userResult.isFailure) {
        return ResponseHandler.notFound(res, "User", extReq.id);
      }

      logger.info("Profile updated", {
        userId,
        requestId: extReq.id,
      });

      ResponseHandler.ok(
        res,
        {
          message: "Profile will be updated",
          firstName,
          lastName,
        },
        "Profile updated successfully",
        extReq.id
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const extReq = req as AuthenticatedRequest;
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return ResponseHandler.badRequest(
          res,
          "Refresh token is required",
          undefined,
          extReq.id
        );
      }

      // TODO: Implement refresh token logic
      logger.info("Token refresh requested", {
        requestId: extReq.id,
      });

      ResponseHandler.ok(
        res,
        {
          message: "Token refresh not yet implemented",
        },
        "Token refresh endpoint",
        extReq.id
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const extReq = req as AuthenticatedRequest;
      const userId = extReq.user.userId;

      logger.info("User logout", {
        userId,
        requestId: extReq.id,
      });

      ResponseHandler.ok(
        res,
        {
          message: "Logged out successfully",
        },
        "Logout successful",
        extReq.id
      );
    } catch (error) {
      next(error);
    }
  };
}
