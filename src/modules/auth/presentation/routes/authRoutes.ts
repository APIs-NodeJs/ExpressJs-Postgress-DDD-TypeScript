import { Router } from "express";
import { AuthController } from "../http/controllers/AuthController";
import { AuthMiddleware } from "../http/middlewares/AuthMiddleware";
import { validateRequest } from "../../../../shared/middlewares/validateRequest";
import { createRateLimiter } from "../../../../shared/middlewares/rateLimiter";
import { signUpSchema, loginSchema } from "../http/validators/authSchemas";

export function createAuthRoutes(
  authController: AuthController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Rate limiters
  const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: "Too many authentication attempts",
  });

  const apiRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
  });

  // Public routes with strict rate limiting
  router.post(
    "/signup",
    authRateLimiter,
    validateRequest(signUpSchema),
    authController.signUp
  );

  router.post(
    "/login",
    authRateLimiter,
    validateRequest(loginSchema),
    authController.login
  );

  // Protected routes with standard rate limiting
  router.get(
    "/profile",
    apiRateLimiter,
    authMiddleware.authenticate(),
    authController.getProfile
  );

  return router;
}
