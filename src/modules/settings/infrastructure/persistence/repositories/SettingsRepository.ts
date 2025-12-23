import { BaseRepository } from "@shared/infrastructure/BaseRepository";
import { ISettingsRepository } from "@modules/settings/domain/repositories/ISettingsRepository";
import {
  UserSettings,
  NotificationPreferences,
} from "@modules/settings/domain/entities/UserSettings";
import { UserSettingsModel } from "../models/UserSettingsModel";

export class SettingsRepository
  extends BaseRepository<UserSettings, UserSettingsModel>
  implements ISettingsRepository
{
  constructor() {
    super(UserSettingsModel);
  }

  protected toDomain(model: UserSettingsModel): UserSettings {
    const settings = UserSettings.create(
      {
        userId: model.userId,
        theme: model.theme as "light" | "dark" | "system",
        language: model.language,
        timezone: model.timezone,
        dateFormat: model.dateFormat,
        weekStartsOn: model.weekStartsOn as 0 | 1 | 6,
        emailNotifications: model.emailNotifications,
        pushNotifications: model.pushNotifications,
        compactMode: model.compactMode,
        notificationPreferences:
          model.notificationPreferences as NotificationPreferences,
      },
      model.id
    );

    // Restore 2FA settings
    if (model.twoFactorEnabled) {
      (settings as any).props.twoFactorEnabled = model.twoFactorEnabled;
      (settings as any).props.twoFactorSecret = model.twoFactorSecret;
      (settings as any).props.backupCodes = model.backupCodes;
    }

    (settings as any).props.createdAt = model.createdAt;
    (settings as any).props.updatedAt = model.updatedAt;

    return settings;
  }

  protected toModel(domain: UserSettings): Partial<UserSettingsModel> {
    return {
      id: domain.id,
      userId: domain.userId,
      theme: domain.theme,
      language: domain.language,
      timezone: domain.timezone,
      dateFormat: domain.dateFormat,
      weekStartsOn: domain.weekStartsOn,
      emailNotifications: domain.emailNotifications,
      pushNotifications: domain.pushNotifications,
      compactMode: domain.compactMode,
      notificationPreferences: domain.notificationPreferences as any,
      twoFactorEnabled: domain.twoFactorEnabled,
      twoFactorSecret: domain.twoFactorSecret,
      backupCodes: domain.backupCodes,
    };
  }

  async findByUserId(userId: string): Promise<UserSettings | null> {
    const model = await this.model.findOne({ where: { userId } });
    return model ? this.toDomain(model) : null;
  }
}
