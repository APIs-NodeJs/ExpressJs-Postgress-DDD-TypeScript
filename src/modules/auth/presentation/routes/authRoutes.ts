import { Router } from "express";
import { AuthController } from "../http/controllers/AuthController";
import { AuthMiddleware } from "../http/middlewares/AuthMiddleware";
import { ValidationMiddleware } from "../http/middlewares/ValidationMiddleware";
import { SignUpDto } from "../http/dto/SignUpDto";
import { LoginDto } from "../http/dto/LoginDto";

export function createAuthRoutes(
  authController: AuthController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Public routes
  router.post(
    "/signup",
    ValidationMiddleware.validate(SignUpDto),
    authController.signUp
  );

  router.post(
    "/login",
    ValidationMiddleware.validate(LoginDto),
    authController.login
  );

  // Protected routes
  router.get(
    "/profile",
    authMiddleware.authenticate(),
    authController.getProfile
  );

  return router;
}
