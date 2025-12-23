import { body } from "express-validator";

export const updateSettingsValidator = [
  body("theme")
    .optional()
    .isIn(["light", "dark", "system"])
    .withMessage("Theme must be light, dark, or system"),
  body("language")
    .optional()
    .isString()
    .isLength({ min: 2, max: 10 })
    .withMessage("Language must be a valid language code"),
  body("timezone")
    .optional()
    .isString()
    .withMessage("Timezone must be a valid timezone string"),
  body("dateFormat")
    .optional()
    .isString()
    .withMessage("Date format must be a string"),
  body("weekStartsOn")
    .optional()
    .isIn([0, 1, 6])
    .withMessage(
      "Week starts on must be 0 (Sunday), 1 (Monday), or 6 (Saturday)"
    ),
  body("emailNotifications")
    .optional()
    .isBoolean()
    .withMessage("Email notifications must be a boolean"),
  body("pushNotifications")
    .optional()
    .isBoolean()
    .withMessage("Push notifications must be a boolean"),
  body("compactMode")
    .optional()
    .isBoolean()
    .withMessage("Compact mode must be a boolean"),
];

export const updateProfileValidator = [
  body("name")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .trim(),
  body("avatar").optional().isURL().withMessage("Avatar must be a valid URL"),
  body("phone")
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Phone must be a valid phone number"),
  body("title")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Title must be less than 100 characters")
    .trim(),
  body("bio")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Bio must be less than 500 characters")
    .trim(),
];

export const updateNotificationPreferencesValidator = [
  body("taskAssigned")
    .optional()
    .isBoolean()
    .withMessage("Task assigned must be a boolean"),
  body("taskCompleted")
    .optional()
    .isBoolean()
    .withMessage("Task completed must be a boolean"),
  body("bugReported")
    .optional()
    .isBoolean()
    .withMessage("Bug reported must be a boolean"),
  body("bugResolved")
    .optional()
    .isBoolean()
    .withMessage("Bug resolved must be a boolean"),
  body("featureApproved")
    .optional()
    .isBoolean()
    .withMessage("Feature approved must be a boolean"),
  body("releaseDeployed")
    .optional()
    .isBoolean()
    .withMessage("Release deployed must be a boolean"),
  body("sprintStarted")
    .optional()
    .isBoolean()
    .withMessage("Sprint started must be a boolean"),
  body("sprintCompleted")
    .optional()
    .isBoolean()
    .withMessage("Sprint completed must be a boolean"),
  body("mentionedInComment")
    .optional()
    .isBoolean()
    .withMessage("Mentioned in comment must be a boolean"),
  body("weeklyDigest")
    .optional()
    .isBoolean()
    .withMessage("Weekly digest must be a boolean"),
];

export const changePasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain a lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number"),
];

export const verifyTwoFactorValidator = [
  body("code")
    .matches(/^\d{6}$/)
    .withMessage("Code must be a 6-digit number"),
];

export const disableTwoFactorValidator = [
  body("password").notEmpty().withMessage("Password is required"),
];
