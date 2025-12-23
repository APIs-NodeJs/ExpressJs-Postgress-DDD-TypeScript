import { Router } from "express";
import { RoleController } from "../controllers/RoleController";
import { authenticate } from "../middlewares/authenticate";
import { checkRole } from "../middlewares/checkRole";
import { validateRequest } from "../middlewares/validateRequest";
import { body, param } from "express-validator";

const router = Router();
const roleController = new RoleController();

// Validators
const assignRoleValidator = [
  body("userId").isUUID().withMessage("Valid user ID is required"),
  body("role")
    .isIn(["admin", "moderator", "user"])
    .withMessage("Role must be admin, moderator, or user"),
];

const userIdValidator = [
  param("userId").isUUID().withMessage("Valid user ID is required"),
];

const roleParamValidator = [
  param("role")
    .isIn(["admin", "moderator", "user"])
    .withMessage("Role must be admin, moderator, or user"),
];

// All routes require authentication
router.use(authenticate);

// Admin-only routes
router.post(
  "/assign",
  checkRole("admin"),
  assignRoleValidator,
  validateRequest,
  roleController.assignRole
);

router.delete(
  "/:userId",
  checkRole("admin"),
  userIdValidator,
  validateRequest,
  roleController.removeRole
);

router.get(
  "/users/:role",
  checkRole("admin"),
  roleParamValidator,
  validateRequest,
  roleController.getUsersByRole
);

// Admin and moderators can view roles
router.get(
  "/:userId",
  checkRole("admin", "moderator"),
  userIdValidator,
  validateRequest,
  roleController.getUserRole
);

export default router;
