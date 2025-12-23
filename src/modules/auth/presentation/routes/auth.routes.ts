import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { RoleController } from "../controllers/RoleController";
import { authenticate } from "../middlewares/authenticate";
import { checkRole } from "../middlewares/checkRole";
import { validateRequest } from "../middlewares/validateRequest";
import {
  loginValidator,
  signupValidator,
  updateProfileValidator,
  changePasswordValidator,
} from "@modules/auth/infrastructure/validators/AuthValidators";
import { body, param } from "express-validator";

const router = Router();
const authController = new AuthController();
const roleController = new RoleController();

// ============================================================================
// PUBLIC ROUTES - No authentication required
// ============================================================================
router.post("/login", loginValidator, validateRequest, authController.login);
router.post("/signup", signupValidator, validateRequest, authController.signup);
router.post("/refresh", authController.refreshToken);
router.post("/password/reset-request", authController.requestPasswordReset);
router.post("/password/reset", authController.resetPassword);
router.post("/verify-email", authController.verifyEmail);

// ============================================================================
// PROTECTED ROUTES - Authentication required
// ============================================================================
router.use(authenticate); // All routes below require authentication

// User profile management
router.get("/me", authController.getCurrentUser); // Returns role + permissions
router.get("/me/roles", authController.getUserRoles); // Returns detailed role info
router.patch(
  "/me",
  updateProfileValidator,
  validateRequest,
  authController.updateProfile
);
router.post(
  "/password/change",
  changePasswordValidator,
  validateRequest,
  authController.changePassword
);
router.post("/logout", authController.logout);

// Email verification
router.post("/resend-verification", authController.resendVerification);

// ============================================================================
// ROLE MANAGEMENT ROUTES - Admin only
// ============================================================================

// Get user's role
router.get(
  "/roles/:userId",
  checkRole("admin", "moderator"),
  [param("userId").isUUID().withMessage("Valid user ID is required")],
  validateRequest,
  roleController.getUserRole
);

// Assign role to user (admin only)
router.post(
  "/roles/assign",
  checkRole("admin"),
  [
    body("userId").isUUID().withMessage("Valid user ID is required"),
    body("role")
      .isIn(["owner", "admin", "moderator", "user"])
      .withMessage("Role must be owner, admin, moderator, or user"),
  ],
  validateRequest,
  roleController.assignRole
);

// Remove user's role (admin only)
router.delete(
  "/roles/:userId",
  checkRole("admin"),
  [param("userId").isUUID().withMessage("Valid user ID is required")],
  validateRequest,
  roleController.removeRole
);

// Get all users with specific role (admin only)
router.get(
  "/roles/users/:role",
  checkRole("admin"),
  [
    param("role")
      .isIn(["owner", "admin", "moderator", "user"])
      .withMessage("Role must be owner, admin, moderator, or user"),
  ],
  validateRequest,
  roleController.getUsersByRole
);

export default router;
