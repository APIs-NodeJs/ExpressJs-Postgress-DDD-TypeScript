// src/modules/settings/application/dtos/SettingsDtos.ts

export interface UserSettings {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  dateFormat: string;
  weekStartsOn: 0 | 1 | 6;
  emailNotifications: boolean;
  pushNotifications: boolean;
  compactMode: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  title?: string;
  bio?: string;
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

export interface TwoFactorSetup {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

export interface UpdateSettingsRequest {
  theme?: "light" | "dark" | "system";
  language?: string;
  timezone?: string;
  dateFormat?: string;
  weekStartsOn?: 0 | 1 | 6;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  compactMode?: boolean;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
  phone?: string;
  title?: string;
  bio?: string;
}

export interface UpdateNotificationPreferencesRequest {
  taskAssigned?: boolean;
  taskCompleted?: boolean;
  bugReported?: boolean;
  bugResolved?: boolean;
  featureApproved?: boolean;
  releaseDeployed?: boolean;
  sprintStarted?: boolean;
  sprintCompleted?: boolean;
  mentionedInComment?: boolean;
  weeklyDigest?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyTwoFactorRequest {
  code: string;
}

export interface DisableTwoFactorRequest {
  password: string;
}
