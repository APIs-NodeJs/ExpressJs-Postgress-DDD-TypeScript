import { Request, Response } from "express";
import { AuthApplicationService } from "../../../application/services/AuthApplicationService";

export class AuthController {
  constructor(private readonly authService: AuthApplicationService) {}

  signUp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName } = req.body;

      const result = await this.authService.signUp(
        email,
        password,
        firstName,
        lastName
      );

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      const data = result.getValue();

      res.status(201).json({
        success: true,
        data: {
          userId: data.userId,
          workspaceId: data.workspaceId,
          email: data.email,
        },
        message: "User created successfully",
      });
    } catch (error) {
      console.error("[AuthController] SignUp error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip;

      const result = await this.authService.login(email, password, ipAddress);

      if (result.isFailure) {
        res.status(401).json({
          success: false,
          error: result.error,
        });
        return;
      }

      const data = result.getValue();

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
      });
    } catch (error) {
      console.error("[AuthController] Login error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;

      const result = await this.authService.getUser(userId);

      if (result.isFailure) {
        res.status(404).json({
          success: false,
          error: result.error,
        });
        return;
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
      });
    } catch (error) {
      console.error("[AuthController] GetProfile error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  };
}
