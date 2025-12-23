// src/modules/auth/presentation/controllers/AuthController.ts
import { Response } from "express";
import { AuthRequest } from "../middlewares/authenticate";
import { ApiResponse } from "@infrastructure/http/responses/ApiResponse";
import { LoginUseCase } from "@modules/auth/application/use-cases/LoginUseCase";
import { SignupUseCase } from "@modules/auth/application/use-cases/SignupUseCase";
import { GetCurrentUserUseCase } from "@modules/auth/application/use-cases/GetCurrentUserUseCase";
import { GetUserRoleUseCase } from "@modules/auth/application/use-cases/GetUserRoleUseCase";
import { UpdateProfileUseCase } from "@modules/auth/application/use-cases/UpdateProfileUseCase";
import { ChangePasswordUseCase } from "@modules/auth/application/use-cases/ChangePasswordUseCase";
import { RefreshTokenUseCase } from "@modules/auth/application/use-cases/RefreshTokenUseCase";
import { RequestPasswordResetUseCase } from "@modules/auth/application/use-cases/RequestPasswordResetUseCase";
import { ResetPasswordUseCase } from "@modules/auth/application/use-cases/ResetPasswordUseCase";
import { UserRepository } from "@modules/auth/infrastructure/persistence/repositories/UserRepository";
import { UserRoleRepository } from "@modules/auth/infrastructure/persistence/repositories/UserRoleRepository";
import { WorkspaceRepository } from "@modules/auth/infrastructure/persistence/repositories/WorkspaceRepository";
import { SubscriptionRepository } from "@modules/billing/infrastructure/persistence/repositories/SubscriptionRepository";

export class AuthController {
  private loginUseCase: LoginUseCase;
  private signupUseCase: SignupUseCase;
  private getCurrentUserUseCase: GetCurrentUserUseCase;
  private getUserRoleUseCase: GetUserRoleUseCase;
  private updateProfileUseCase: UpdateProfileUseCase;
  private changePasswordUseCase: ChangePasswordUseCase;
  private refreshTokenUseCase: RefreshTokenUseCase;
  private requestPasswordResetUseCase: RequestPasswordResetUseCase;
  private resetPasswordUseCase: ResetPasswordUseCase;

  constructor() {
    const userRepository = new UserRepository();
    const userRoleRepository = new UserRoleRepository();
    const workspaceRepository = new WorkspaceRepository();
    const subscriptionRepository = new SubscriptionRepository();

    this.loginUseCase = new LoginUseCase(userRepository);
    this.signupUseCase = new SignupUseCase(
      userRepository,
      workspaceRepository,
      subscriptionRepository
    );
    this.getCurrentUserUseCase = new GetCurrentUserUseCase(
      userRepository,
      userRoleRepository
    );
    this.getUserRoleUseCase = new GetUserRoleUseCase(userRoleRepository);
    this.updateProfileUseCase = new UpdateProfileUseCase(userRepository);
    this.changePasswordUseCase = new ChangePasswordUseCase(userRepository);
    this.refreshTokenUseCase = new RefreshTokenUseCase();
    this.requestPasswordResetUseCase = new RequestPasswordResetUseCase(
      userRepository
    );
    this.resetPasswordUseCase = new ResetPasswordUseCase(userRepository);
  }

  login = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      const result = await this.loginUseCase.execute(req.body);

      if (result.isFailure) {
        return ApiResponse.unauthorized(res, result.error!);
      }

      return ApiResponse.success(res, result.getValue());
    } catch (error) {
      console.error("Login error:", error);
      return ApiResponse.internalError(res);
    }
  };

  signup = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      const result = await this.signupUseCase.execute(req.body);

      if (result.isFailure) {
        return ApiResponse.badRequest(res, result.error!);
      }

      return ApiResponse.created(res, result.getValue());
    } catch (error) {
      console.error("Signup error:", error);
      return ApiResponse.internalError(res);
    }
  };

  getCurrentUser = async (
    req: AuthRequest,
    res: Response
  ): Promise<Response> => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res);
      }

      const result = await this.getCurrentUserUseCase.execute(req.user.userId);

      if (result.isFailure) {
        return ApiResponse.notFound(res, result.error!);
      }

      return ApiResponse.success(res, result.getValue());
    } catch (error) {
      console.error("Get current user error:", error);
      return ApiResponse.internalError(res);
    }
  };

  getUserRoles = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res);
      }

      // Get user role from database
      const result = await this.getUserRoleUseCase.execute(req.user.userId);

      if (result.isFailure) {
        return ApiResponse.badRequest(res, result.error!);
      }

      const userRole = result.getValue();

      // If no role found, return empty array
      if (!userRole) {
        return ApiResponse.success(res, []);
      }

      // Format the response to match the expected structure
      const roleData = {
        id: userRole.id,
        userId: userRole.userId,
        role: userRole.role,
        workspaceId: req.user.workspaceId,
        createdAt: userRole.createdAt,
      };

      return ApiResponse.success(res, [roleData]);
    } catch (error) {
      console.error("Get user roles error:", error);
      return ApiResponse.internalError(res);
    }
  };

  updateProfile = async (
    req: AuthRequest,
    res: Response
  ): Promise<Response> => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res);
      }

      const result = await this.updateProfileUseCase.execute({
        userId: req.user.userId,
        data: req.body,
      });

      if (result.isFailure) {
        return ApiResponse.badRequest(res, result.error!);
      }

      return ApiResponse.success(res, result.getValue());
    } catch (error) {
      console.error("Update profile error:", error);
      return ApiResponse.internalError(res);
    }
  };

  changePassword = async (
    req: AuthRequest,
    res: Response
  ): Promise<Response> => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res);
      }

      const result = await this.changePasswordUseCase.execute({
        userId: req.user.userId,
        data: req.body,
      });

      if (result.isFailure) {
        return ApiResponse.badRequest(res, result.error!);
      }

      return ApiResponse.success(res, {
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      return ApiResponse.internalError(res);
    }
  };

  refreshToken = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      const result = await this.refreshTokenUseCase.execute(req.body);

      if (result.isFailure) {
        return ApiResponse.unauthorized(res, result.error!);
      }

      return ApiResponse.success(res, result.getValue());
    } catch (error) {
      console.error("Refresh token error:", error);
      return ApiResponse.internalError(res);
    }
  };

  requestPasswordReset = async (
    req: AuthRequest,
    res: Response
  ): Promise<Response> => {
    try {
      const result = await this.requestPasswordResetUseCase.execute(req.body);

      if (result.isFailure) {
        return ApiResponse.badRequest(res, result.error!);
      }

      return ApiResponse.success(res, { message: "Password reset email sent" });
    } catch (error) {
      console.error("Request password reset error:", error);
      return ApiResponse.internalError(res);
    }
  };

  resetPassword = async (
    req: AuthRequest,
    res: Response
  ): Promise<Response> => {
    try {
      const result = await this.resetPasswordUseCase.execute(req.body);

      if (result.isFailure) {
        return ApiResponse.badRequest(res, result.error!);
      }

      return ApiResponse.success(res, { message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      return ApiResponse.internalError(res);
    }
  };

  logout = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      // TODO: Implement token blacklisting if needed
      return ApiResponse.noContent(res);
    } catch (error) {
      console.error("Logout error:", error);
      return ApiResponse.internalError(res);
    }
  };

  verifyEmail = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      // TODO: Implement email verification
      return ApiResponse.success(res, {
        message: "Email verified successfully",
      });
    } catch (error) {
      console.error("Verify email error:", error);
      return ApiResponse.internalError(res);
    }
  };

  resendVerification = async (
    req: AuthRequest,
    res: Response
  ): Promise<Response> => {
    try {
      // TODO: Implement resend verification
      return ApiResponse.success(res, { message: "Verification email sent" });
    } catch (error) {
      console.error("Resend verification error:", error);
      return ApiResponse.internalError(res);
    }
  };
}
