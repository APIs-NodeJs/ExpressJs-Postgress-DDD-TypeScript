// src/modules/settings/domain/entities/UserSettings.ts

import { Entity } from "@shared/domain/Entity";
import { v4 as uuidv4 } from "uuid";

interface UserSettingsProps {
  userId: string;
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  dateFormat: string;
  weekStartsOn: 0 | 1 | 6;
  emailNotifications: boolean;
  pushNotifications: boolean;
  compactMode: boolean;
  notificationPreferences: NotificationPreferences;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  taskAssigned: boolean;
  taskCompleted: boolean;
  bugReported: boolean;
  bugResolved: boolean;
  featureApproved: boolean;
  releaseDeployed: boolean;
  sprintStarted: boolean;
  sprintCompleted: boolean;
  mentionedInComment: boolean;
  weeklyDigest: boolean;
}

export class UserSettings extends Entity<UserSettingsProps> {
  private constructor(props: UserSettingsProps, id?: string) {
    super(props, id);
  }

  protected generateId(): string {
    return uuidv4();
  }

  get userId(): string {
    return this.props.userId;
  }

  get theme(): "light" | "dark" | "system" {
    return this.props.theme;
  }

  get language(): string {
    return this.props.language;
  }

  get timezone(): string {
    return this.props.timezone;
  }

  get dateFormat(): string {
    return this.props.dateFormat;
  }

  get weekStartsOn(): 0 | 1 | 6 {
    return this.props.weekStartsOn;
  }

  get emailNotifications(): boolean {
    return this.props.emailNotifications;
  }

  get pushNotifications(): boolean {
    return this.props.pushNotifications;
  }

  get compactMode(): boolean {
    return this.props.compactMode;
  }

  get notificationPreferences(): NotificationPreferences {
    return this.props.notificationPreferences;
  }

  get twoFactorEnabled(): boolean {
    return this.props.twoFactorEnabled;
  }

  get twoFactorSecret(): string | undefined {
    return this.props.twoFactorSecret;
  }

  get backupCodes(): string[] | undefined {
    return this.props.backupCodes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateSettings(updates: {
    theme?: "light" | "dark" | "system";
    language?: string;
    timezone?: string;
    dateFormat?: string;
    weekStartsOn?: 0 | 1 | 6;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    compactMode?: boolean;
  }): void {
    if (updates.theme !== undefined) this.props.theme = updates.theme;
    if (updates.language !== undefined) this.props.language = updates.language;
    if (updates.timezone !== undefined) this.props.timezone = updates.timezone;
    if (updates.dateFormat !== undefined)
      this.props.dateFormat = updates.dateFormat;
    if (updates.weekStartsOn !== undefined)
      this.props.weekStartsOn = updates.weekStartsOn;
    if (updates.emailNotifications !== undefined)
      this.props.emailNotifications = updates.emailNotifications;
    if (updates.pushNotifications !== undefined)
      this.props.pushNotifications = updates.pushNotifications;
    if (updates.compactMode !== undefined)
      this.props.compactMode = updates.compactMode;
    this.props.updatedAt = new Date();
  }

  public updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>
  ): void {
    this.props.notificationPreferences = {
      ...this.props.notificationPreferences,
      ...preferences,
    };
    this.props.updatedAt = new Date();
  }

  public enableTwoFactor(secret: string, backupCodes: string[]): void {
    this.props.twoFactorEnabled = true;
    this.props.twoFactorSecret = secret;
    this.props.backupCodes = backupCodes;
    this.props.updatedAt = new Date();
  }

  public disableTwoFactor(): void {
    this.props.twoFactorEnabled = false;
    this.props.twoFactorSecret = undefined;
    this.props.backupCodes = undefined;
    this.props.updatedAt = new Date();
  }

  public static create(
    props: {
      userId: string;
      theme?: "light" | "dark" | "system";
      language?: string;
      timezone?: string;
      dateFormat?: string;
      weekStartsOn?: 0 | 1 | 6;
      emailNotifications?: boolean;
      pushNotifications?: boolean;
      compactMode?: boolean;
      notificationPreferences?: Partial<NotificationPreferences>;
    },
    id?: string
  ): UserSettings {
    const defaultNotifications: NotificationPreferences = {
      taskAssigned: true,
      taskCompleted: true,
      bugReported: true,
      bugResolved: true,
      featureApproved: true,
      releaseDeployed: true,
      sprintStarted: true,
      sprintCompleted: true,
      mentionedInComment: true,
      weeklyDigest: true,
    };

    return new UserSettings(
      {
        userId: props.userId,
        theme: props.theme || "system",
        language: props.language || "en",
        timezone: props.timezone || "UTC",
        dateFormat: props.dateFormat || "YYYY-MM-DD",
        weekStartsOn: props.weekStartsOn ?? 1,
        emailNotifications: props.emailNotifications ?? true,
        pushNotifications: props.pushNotifications ?? true,
        compactMode: props.compactMode ?? false,
        notificationPreferences: {
          ...defaultNotifications,
          ...props.notificationPreferences,
        },
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id
    );
  }
}
