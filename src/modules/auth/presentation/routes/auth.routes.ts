// src/modules/auth/presentation/routes/auth.routes.ts

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateBody } from '@core/middleware';
import { asyncHandler } from '@core/middleware';
import { authenticate } from '../middleware/authenticate.middleware';
import { authRateLimiter } from '@core/middleware';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  LogoutSchema,
} from '../validators/auth.validator';

export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  /**
   * @route   POST /api/v1/auth/register
   * @desc    Register a new user
   * @access  Public
   */
  router.post(
    '/register',
    authRateLimiter,
    validateBody(RegisterSchema),
    asyncHandler(authController.register)
  );

  /**
   * @route   POST /api/v1/auth/login
   * @desc    Login user
   * @access  Public
   */
  router.post(
    '/login',
    authRateLimiter,
    validateBody(LoginSchema),
    asyncHandler(authController.login)
  );

  /**
   * @route   POST /api/v1/auth/refresh
   * @desc    Refresh access token
   * @access  Public
   */
  router.post(
    '/refresh',
    validateBody(RefreshTokenSchema),
    asyncHandler(authController.refreshToken)
  );

  /**
   * @route   POST /api/v1/auth/logout
   * @desc    Logout user (revoke session)
   * @access  Public
   */
  router.post('/logout', validateBody(LogoutSchema), asyncHandler(authController.logout));

  /**
   * @route   GET /api/v1/auth/me
   * @desc    Get current user profile
   * @access  Private
   */
  router.get('/me', authenticate, asyncHandler(authController.getCurrentUser));

  return router;
}
