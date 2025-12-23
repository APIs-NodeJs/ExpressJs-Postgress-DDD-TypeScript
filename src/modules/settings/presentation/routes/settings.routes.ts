// src/modules/settings/presentation/routes/settings.routes.ts

import { Router } from "express";
import { SettingsController } from "../controllers/SettingsController";
import { authenticate } from "@modules/auth/presentation/middlewares/authenticate";
import { validateRequest } from "@modules/auth/presentation/middlewares/validateRequest";
import {
  updateSettingsValidator,
  updateProfileValidator,
  updateNotificationPreferencesValidator,
  changePasswordValidator,
  verifyTwoFactorValidator,
  disableTwoFactorValidator,
} from "@modules/settings/infrastructure/validators/SettingsValidators";

const router = Router();
const settingsController = new SettingsController();

// All settings routes require authentication
router.use(authenticate);

// User Settings
router.get("/me/settings", settingsController.getSettings);
router.patch(
  "/me/settings",
  updateSettingsValidator,
  validateRequest,
  settingsController.updateSettings
);

// User Profile
router.get("/me/profile", settingsController.getProfile);
router.patch(
  "/me/profile",
  updateProfileValidator,
  validateRequest,
  settingsController.updateProfile
);

// Notification Preferences
router.get("/me/notifications", settingsController.getNotifications);
router.patch(
  "/me/notifications",
  updateNotificationPreferencesValidator,
  validateRequest,
  settingsController.updateNotifications
);

// Password Management
router.post(
  "/me/password",
  changePasswordValidator,
  validateRequest,
  settingsController.changePassword
);

// Two-Factor Authentication
router.post("/me/2fa/enable", settingsController.enableTwoFactor);
router.post(
  "/me/2fa/verify",
  verifyTwoFactorValidator,
  validateRequest,
  settingsController.verifyTwoFactor
);
router.post(
  "/me/2fa/disable",
  disableTwoFactorValidator,
  validateRequest,
  settingsController.disableTwoFactor
);

export default router;
