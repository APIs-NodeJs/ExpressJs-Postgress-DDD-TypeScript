// src/modules/user/presentation/routes/user.routes.ts

import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validateBody, validateParams, validateQuery, asyncHandler } from '@core/middleware';
import { authenticate } from '@modules/auth/presentation/middleware/authenticate.middleware';
import {
  UpdateProfileSchema,
  ChangeStatusSchema,
  ListUsersQuerySchema,
  UserIdParamSchema,
} from '../validators/user.validator';

export function createUserRoutes(userController: UserController): Router {
  const router = Router();

  /**
   * @route   GET /api/v1/users
   * @desc    Get list of users (admin)
   * @access  Private
   */
  router.get(
    '/',
    authenticate,
    validateQuery(ListUsersQuerySchema),
    asyncHandler(userController.listUsers)
  );

  /**
   * @route   GET /api/v1/users/:userId
   * @desc    Get user by ID
   * @access  Private
   */
  router.get(
    '/:userId',
    authenticate,
    validateParams(UserIdParamSchema),
    asyncHandler(userController.getUser)
  );

  /**
   * @route   PATCH /api/v1/users/:userId/profile
   * @desc    Update user profile
   * @access  Private (own profile only)
   */
  router.patch(
    '/:userId/profile',
    authenticate,
    validateParams(UserIdParamSchema),
    validateBody(UpdateProfileSchema),
    asyncHandler(userController.updateProfile)
  );

  /**
   * @route   PATCH /api/v1/users/:userId/status
   * @desc    Change user status (admin)
   * @access  Private (admin only)
   */
  router.patch(
    '/:userId/status',
    authenticate,
    validateParams(UserIdParamSchema),
    validateBody(ChangeStatusSchema),
    asyncHandler(userController.changeStatus)
  );

  /**
   * @route   DELETE /api/v1/users/:userId
   * @desc    Delete user (soft delete)
   * @access  Private (admin only)
   */
  router.delete(
    '/:userId',
    authenticate,
    validateParams(UserIdParamSchema),
    asyncHandler(userController.deleteUser)
  );

  return router;
}
