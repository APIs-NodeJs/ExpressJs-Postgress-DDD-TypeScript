// src/modules/auth/presentation/http/controllers/AuthController.ts
import { Request, Response, NextFunction } from "express";
import { AuthApplicationService } from "../../../application/services/AuthApplicationService";
import { logger } from "../../../../../shared/utils/logger";
import { NotFoundError } from "../../../../../shared/errors/AppError";

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
        res.status(400).json({
          success: false,
          error: {
            code: "SIGNUP_FAILED",
            message: result.error,
          },
          requestId: extReq.id,
        });
        return;
      }

      const data = result.getValue();

      logger.info("User signup successful", {
        userId: data.userId,
        requestId: extReq.id,
      });

      res.status(201).json({
        success: true,
        data: {
          userId: data.userId,
          workspaceId: data.workspaceId,
          email: data.email,
        },
        message: "User created successfully",
        requestId: extReq.id,
      });
    } catch (error) {
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
      const extReq = req as AuthenticatedRequest;
      const ipAddress = req.ip;

      const result = await this.authService.login(email, password, ipAddress);

      if (result.isFailure) {
        res.status(401).json({
          success: false,
          error: {
            code: "LOGIN_FAILED",
            message: result.error,
          },
          requestId: extReq.id,
        });
        return;
      }

      const data = result.getValue();

      logger.info("User login successful", {
        userId: data.userId,
        requestId: extReq.id,
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
        requestId: extReq.id,
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
      const extReq = req as AuthenticatedRequest;
      const userId = extReq.user.userId;

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
        requestId: extReq.id,
      });
    } catch (error) {
      next(error);
    }
  };
}
