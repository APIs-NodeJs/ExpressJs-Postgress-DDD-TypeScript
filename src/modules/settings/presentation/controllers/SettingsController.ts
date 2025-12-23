import { Response } from "express";
import { AuthRequest } from "@modules/auth/presentation/middlewares/authenticate";
import { ApiResponse } from "@infrastructure/http/responses/ApiResponse";
import {
  GetUserSettingsUseCase,
  UpdateUserSettingsUseCase,
  GetUserProfileUseCase,
  UpdateUserProfileUseCase,
  GetNotificationPreferencesUseCase,
  UpdateNotificationPreferencesUseCase,
  ChangePasswordUseCase,
  EnableTwoFactorUseCase,
  VerifyTwoFactorUseCase,
  DisableTwoFactorUseCase,
} from "@modules/settings/application/use-cases/SettingsUseCases";
import { SettingsRepository } from "@modules/settings/infrastructure/persistence/repositories/SettingsRepository";
import { UserRepository } from "@modules/auth/infrastructure/persistence/repositories/UserRepository";

export class SettingsController {
  private getUserSettingsUseCase: GetUserSettingsUseCase;
  private updateUserSettingsUseCase: UpdateUserSettingsUseCase;
  private getUserProfileUseCase: GetUserProfileUseCase;
  private updateUserProfileUseCase: UpdateUserProfileUseCase;
  private getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase;
  private updateNotificationPreferencesUseCase: UpdateNotificationPreferencesUseCase;
  private changePasswordUseCase: ChangePasswordUseCase;
  private enableTwoFactorUseCase: EnableTwoFactorUseCase;
  private verifyTwoFactorUseCase: VerifyTwoFactorUseCase;
  private disableTwoFactorUseCase: DisableTwoFactorUseCase;

  constructor() {
    const settingsRepository = new SettingsRepository();
    const userRepository = new UserRepository();

    this.getUserSettingsUseCase = new GetUserSettingsUseCase(
      settingsRepository
    );
    this.updateUserSettingsUseCase = new UpdateUserSettingsUseCase(
      settingsRepository
    );
    this.getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
    this.updateUserProfileUseCase = new UpdateUserProfileUseCase(
      userRepository
    );
    this.getNotificationPreferencesUseCase =
      new GetNotificationPreferencesUseCase(settingsRepository);
    this.updateNotificationPreferencesUseCase =
      new UpdateNotificationPreferencesUseCase(settingsRepository);
    this.changePasswordUseCase = new ChangePasswordUseCase(userRepository);
    this.enableTwoFactorUseCase = new EnableTwoFactorUseCase(
      settingsRepository
    );
    this.verifyTwoFactorUseCase = new VerifyTwoFactorUseCase(
      settingsRepository
    );
    this.disableTwoFactorUseCase = new DisableTwoFactorUseCase(
      settingsRepository,
      userRepository
    );
  }

  getSettings = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res);
      }

      const result = await this.getUserSettingsUseCase.execute({
        userId: req.user.userId,
      });

      if (result.isFailure) {
        return ApiResponse.badRequest(res, result.error!);
      }

      return ApiResponse.success(res, result.getValue());
    } catch (error) {
      console.error("Get settings error:", error);
      return ApiResponse.internalError(res);
    }
  };

  updateSettings = async (
    req: AuthRequest,
    res: Response
  ): Promise<Response> => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res);
      }

      const result = await this.updateUserSettingsUseCase.execute({
        userId: req.user.userId,
        data: req.body,
      });

      if (result.isFailure) {
        return ApiResponse.badRequest(res, result.error!);
      }

      return ApiResponse.success(res, result.getValue());
    } catch (error) {
      console.error("Update settings error:", error);
      return ApiResponse.internalError(res);
    }
  };

  getProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res);
      }

      const result = await this.getUserProfileUseCase.execute({
        userId: req.user.userId,
      });

      if (result.isFailure) {
        return ApiResponse.notFound(res, result.error!);
      }

      return ApiResponse.success(res, result.getValue());
    } catch (error) {
      console.error("Get profile error:", error);
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

      const result = await this.updateUserProfileUseCase.execute({
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

  getNotifications = async (
    req: AuthRequest,
    res: Response
  ): Promise<Response> => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res);
      }

      const result = await this.getNotificationPreferencesUseCase.execute({
        userId: req.user.userId,
      });

      if (result.isFailure) {
        return ApiResponse.badRequest(res, result.error!);
      }

      return ApiResponse.success(res, result.getValue());
    } catch (error) {
      console.error("Get notifications error:", error);
      return ApiResponse.internalError(res);
    }
  };

  updateNotifications = async (
    req: AuthRequest,
    res: Response
  ): Promise<Response> => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res);
      }

      const result = await this.updateNotificationPreferencesUseCase.execute({
        userId: req.user.userId,
        data: req.body,
      });

      if (result.isFailure) {
        return ApiResponse.badRequest(res, result.error!);
      }

      return ApiResponse.success(res, result.getValue());
    } catch (error) {
      console.error("Update notifications error:", error);
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

  enableTwoFactor = async (
    req: AuthRequest,
    res: Response
  ): Promise<Response> => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res);
      }

      const result = await this.enableTwoFactorUseCase.execute({
        userId: req.user.userId,
        email: req.user.email,
      });

      if (result.isFailure) {
        return ApiResponse.badRequest(res, result.error!);
      }

      return ApiResponse.success(res, result.getValue());
    } catch (error) {
      console.error("Enable 2FA error:", error);
      return ApiResponse.internalError(res);
    }
  };

  verifyTwoFactor = async (
    req: AuthRequest,
    res: Response
  ): Promise<Response> => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res);
      }

      const result = await this.verifyTwoFactorUseCase.execute({
        userId: req.user.userId,
        data: req.body,
      });

      if (result.isFailure) {
        return ApiResponse.badRequest(res, result.error!);
      }

      return ApiResponse.success(res, {
        message: "2FA enabled successfully",
      });
    } catch (error) {
      console.error("Verify 2FA error:", error);
      return ApiResponse.internalError(res);
    }
  };

  disableTwoFactor = async (
    req: AuthRequest,
    res: Response
  ): Promise<Response> => {
    try {
      if (!req.user) {
        return ApiResponse.unauthorized(res);
      }

      const result = await this.disableTwoFactorUseCase.execute({
        userId: req.user.userId,
        data: req.body,
      });

      if (result.isFailure) {
        return ApiResponse.badRequest(res, result.error!);
      }

      return ApiResponse.success(res, {
        message: "2FA disabled",
      });
    } catch (error) {
      console.error("Disable 2FA error:", error);
      return ApiResponse.internalError(res);
    }
  };
}
