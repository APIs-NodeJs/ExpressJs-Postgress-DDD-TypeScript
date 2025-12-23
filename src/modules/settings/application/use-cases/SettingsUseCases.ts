import { UseCase } from "@shared/application/UseCase";
import { Result } from "@shared/application/Result";
import { ISettingsRepository } from "@modules/settings/domain/repositories/ISettingsRepository";
import { IUserRepository } from "@modules/auth/domain/repositories/IUserRepository";
import { UserSettings } from "@modules/settings/domain/entities/UserSettings";
import { PasswordHasher } from "@modules/auth/infrastructure/security/PasswordHasher";
import { TwoFactorService } from "@modules/settings/infrastructure/security/TwoFactorService";
import {
  UserSettings as UserSettingsDto,
  UserProfile,
  NotificationPreferences,
  TwoFactorSetup,
  UpdateSettingsRequest,
  UpdateProfileRequest,
  UpdateNotificationPreferencesRequest,
  ChangePasswordRequest,
  VerifyTwoFactorRequest,
  DisableTwoFactorRequest,
} from "../dtos/SettingsDtos";

// Get User Settings
interface GetSettingsInput {
  userId: string;
}

export class GetUserSettingsUseCase
  implements UseCase<GetSettingsInput, Result<UserSettingsDto>>
{
  constructor(private settingsRepository: ISettingsRepository) {}

  async execute(input: GetSettingsInput): Promise<Result<UserSettingsDto>> {
    let settings = await this.settingsRepository.findByUserId(input.userId);

    // Create default settings if they don't exist
    if (!settings) {
      settings = UserSettings.create({ userId: input.userId });
      await this.settingsRepository.save(settings);
    }

    const response: UserSettingsDto = {
      theme: settings.theme,
      language: settings.language,
      timezone: settings.timezone,
      dateFormat: settings.dateFormat,
      weekStartsOn: settings.weekStartsOn,
      emailNotifications: settings.emailNotifications,
      pushNotifications: settings.pushNotifications,
      compactMode: settings.compactMode,
    };

    return Result.ok<UserSettingsDto>(response);
  }
}

// Update User Settings
interface UpdateSettingsInput {
  userId: string;
  data: UpdateSettingsRequest;
}

export class UpdateUserSettingsUseCase
  implements UseCase<UpdateSettingsInput, Result<UserSettingsDto>>
{
  constructor(private settingsRepository: ISettingsRepository) {}

  async execute(input: UpdateSettingsInput): Promise<Result<UserSettingsDto>> {
    let settings = await this.settingsRepository.findByUserId(input.userId);

    if (!settings) {
      settings = UserSettings.create({ userId: input.userId });
    }

    settings.updateSettings(input.data);
    const updated = await this.settingsRepository.save(settings);

    const response: UserSettingsDto = {
      theme: updated.theme,
      language: updated.language,
      timezone: updated.timezone,
      dateFormat: updated.dateFormat,
      weekStartsOn: updated.weekStartsOn,
      emailNotifications: updated.emailNotifications,
      pushNotifications: updated.pushNotifications,
      compactMode: updated.compactMode,
    };

    return Result.ok<UserSettingsDto>(response);
  }
}

// Get User Profile
interface GetProfileInput {
  userId: string;
}

export class GetUserProfileUseCase
  implements UseCase<GetProfileInput, Result<UserProfile>>
{
  constructor(private userRepository: IUserRepository) {}

  async execute(input: GetProfileInput): Promise<Result<UserProfile>> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      return Result.fail<UserProfile>("User not found");
    }

    const profile: UserProfile = {
      name: user.name,
      email: user.email.value,
      avatar: user.avatar,
      // Additional fields would come from extended user model
      phone: undefined,
      title: undefined,
      bio: undefined,
    };

    return Result.ok<UserProfile>(profile);
  }
}

// Update User Profile
interface UpdateProfileInput {
  userId: string;
  data: UpdateProfileRequest;
}

export class UpdateUserProfileUseCase
  implements UseCase<UpdateProfileInput, Result<UserProfile>>
{
  constructor(private userRepository: IUserRepository) {}

  async execute(input: UpdateProfileInput): Promise<Result<UserProfile>> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      return Result.fail<UserProfile>("User not found");
    }

    user.updateProfile(
      input.data.name || user.name,
      input.data.avatar || user.avatar
    );

    const updated = await this.userRepository.save(user);

    const profile: UserProfile = {
      name: updated.name,
      email: updated.email.value,
      avatar: updated.avatar,
      phone: undefined,
      title: input.data.title,
      bio: input.data.bio,
    };

    return Result.ok<UserProfile>(profile);
  }
}

// Get Notification Preferences
interface GetNotificationsInput {
  userId: string;
}

export class GetNotificationPreferencesUseCase
  implements UseCase<GetNotificationsInput, Result<NotificationPreferences>>
{
  constructor(private settingsRepository: ISettingsRepository) {}

  async execute(
    input: GetNotificationsInput
  ): Promise<Result<NotificationPreferences>> {
    let settings = await this.settingsRepository.findByUserId(input.userId);

    if (!settings) {
      settings = UserSettings.create({ userId: input.userId });
      await this.settingsRepository.save(settings);
    }

    return Result.ok<NotificationPreferences>(settings.notificationPreferences);
  }
}

// Update Notification Preferences
interface UpdateNotificationsInput {
  userId: string;
  data: UpdateNotificationPreferencesRequest;
}

export class UpdateNotificationPreferencesUseCase
  implements UseCase<UpdateNotificationsInput, Result<NotificationPreferences>>
{
  constructor(private settingsRepository: ISettingsRepository) {}

  async execute(
    input: UpdateNotificationsInput
  ): Promise<Result<NotificationPreferences>> {
    let settings = await this.settingsRepository.findByUserId(input.userId);

    if (!settings) {
      settings = UserSettings.create({ userId: input.userId });
    }

    settings.updateNotificationPreferences(input.data);
    const updated = await this.settingsRepository.save(settings);

    return Result.ok<NotificationPreferences>(updated.notificationPreferences);
  }
}

// Change Password
interface ChangePasswordInput {
  userId: string;
  data: ChangePasswordRequest;
}

export class ChangePasswordUseCase
  implements UseCase<ChangePasswordInput, Result<void>>
{
  constructor(private userRepository: IUserRepository) {}

  async execute(input: ChangePasswordInput): Promise<Result<void>> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      return Result.fail<void>("User not found");
    }

    // Verify current password
    const isValid = await PasswordHasher.compare(
      input.data.currentPassword,
      user.password.value
    );

    if (!isValid) {
      return Result.fail<void>("Current password is incorrect");
    }

    // Validate new password
    if (input.data.newPassword.length < 8) {
      return Result.fail<void>("New password must be at least 8 characters");
    }

    // Hash and update password
    const hashedPassword = await PasswordHasher.hash(input.data.newPassword);
    const { Password } = await import(
      "@modules/auth/domain/value-objects/Password"
    );
    const passwordOrError = Password.createHashed(hashedPassword);

    if (passwordOrError.isFailure) {
      return Result.fail<void>(passwordOrError.error!);
    }

    user.updatePassword(passwordOrError.getValue());
    await this.userRepository.save(user);

    return Result.ok<void>();
  }
}

// Enable Two-Factor Authentication
interface EnableTwoFactorInput {
  userId: string;
  email: string;
}

export class EnableTwoFactorUseCase
  implements UseCase<EnableTwoFactorInput, Result<TwoFactorSetup>>
{
  constructor(private settingsRepository: ISettingsRepository) {}

  async execute(input: EnableTwoFactorInput): Promise<Result<TwoFactorSetup>> {
    let settings = await this.settingsRepository.findByUserId(input.userId);

    if (!settings) {
      settings = UserSettings.create({ userId: input.userId });
    }

    if (settings.twoFactorEnabled) {
      return Result.fail<TwoFactorSetup>(
        "Two-factor authentication is already enabled"
      );
    }

    const secret = TwoFactorService.generateSecret();
    const backupCodes = TwoFactorService.generateBackupCodes();
    const qrCode = TwoFactorService.generateQRCodeUrl(secret, input.email);

    // Store temporarily - will be confirmed after verification
    (settings as any).props.twoFactorSecret = secret;
    (settings as any).props.backupCodes = backupCodes;
    await this.settingsRepository.save(settings);

    const setup: TwoFactorSetup = {
      qrCode,
      secret,
      backupCodes,
    };

    return Result.ok<TwoFactorSetup>(setup);
  }
}

// Verify and Complete Two-Factor Setup
interface VerifyTwoFactorInput {
  userId: string;
  data: VerifyTwoFactorRequest;
}

export class VerifyTwoFactorUseCase
  implements UseCase<VerifyTwoFactorInput, Result<void>>
{
  constructor(private settingsRepository: ISettingsRepository) {}

  async execute(input: VerifyTwoFactorInput): Promise<Result<void>> {
    const settings = await this.settingsRepository.findByUserId(input.userId);

    if (!settings) {
      return Result.fail<void>("Settings not found");
    }

    if (!settings.twoFactorSecret) {
      return Result.fail<void>("No pending 2FA setup found");
    }

    const isValid = TwoFactorService.verifyCode(
      settings.twoFactorSecret,
      input.data.code
    );

    if (!isValid) {
      return Result.fail<void>("Invalid verification code");
    }

    settings.enableTwoFactor(
      settings.twoFactorSecret,
      settings.backupCodes || []
    );
    await this.settingsRepository.save(settings);

    return Result.ok<void>();
  }
}

// Disable Two-Factor Authentication
interface DisableTwoFactorInput {
  userId: string;
  data: DisableTwoFactorRequest;
}

export class DisableTwoFactorUseCase
  implements UseCase<DisableTwoFactorInput, Result<void>>
{
  constructor(
    private settingsRepository: ISettingsRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(input: DisableTwoFactorInput): Promise<Result<void>> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      return Result.fail<void>("User not found");
    }

    // Verify password
    const isValid = await PasswordHasher.compare(
      input.data.password,
      user.password.value
    );

    if (!isValid) {
      return Result.fail<void>("Invalid password");
    }

    const settings = await this.settingsRepository.findByUserId(input.userId);

    if (!settings) {
      return Result.fail<void>("Settings not found");
    }

    if (!settings.twoFactorEnabled) {
      return Result.fail<void>("Two-factor authentication is not enabled");
    }

    settings.disableTwoFactor();
    await this.settingsRepository.save(settings);

    return Result.ok<void>();
  }
}
