import { Request, Response, NextFunction } from "express";
import { AuthApplicationService } from "../../../application/services/AuthApplicationService";
import { logger } from "../../../../../shared/utils/logger";

export class AuthController {
  constructor(private readonly authService: AuthApplicationService) {}

  signUp = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password, firstName, lastName } = req.body;

      const result = await this.authService.signUp(
        email,
        password,
        firstName,
        lastName
      );

      if (result.isFailure) {
        // This shouldn't happen with new error handling, but kept for safety
        res.status(400).json({
          success: false,
          error: {
            code: "SIGNUP_FAILED",
            message: result.error,
          },
          requestId: req.id,
        });
        return;
      }

      const data = result.getValue();

      logger.info("User signup successful", {
        userId: data.userId,
        requestId: req.id,
      });

      res.status(201).json({
        success: true,
        data: {
          userId: data.userId,
          workspaceId: data.workspaceId,
          email: data.email,
        },
        message: "User created successfully",
        requestId: req.id,
      });
    } catch (error) {
      // Pass to error handler middleware
      next(error);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;

      const result = await this.authService.login(email, password, ipAddress);

      if (result.isFailure) {
        res.status(401).json({
          success: false,
          error: {
            code: "LOGIN_FAILED",
            message: result.error,
          },
          requestId: req.id,
        });
        return;
      }

      const data = result.getValue();

      logger.info("User login successful", {
        userId: data.userId,
        requestId: req.id,
        ipAddress,
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: {
            id: data.userId,
            email: data.email,
          },
        },
        message: "Login successful",
        requestId: req.id,
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user.userId;

      const result = await this.authService.getUser(userId);

      if (result.isFailure) {
        throw new NotFoundError("User");
      }

      const user = result.getValue();

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          workspaceId: user.workspaceId,
          status: user.status,
          emailVerified: user.emailVerified,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt,
        },
        requestId: req.id,
      });
    } catch (error) {
      next(error);
    }
  };
}
