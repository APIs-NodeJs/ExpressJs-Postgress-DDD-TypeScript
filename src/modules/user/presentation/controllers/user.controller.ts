// src/modules/user/presentation/controllers/user.controller.ts

import { Request, Response, NextFunction } from 'express';
import { ApiResponseUtil } from '@core/utils';
import { Logger } from '@core/infrastructure/logger';
import { PaginationDtoBuilder } from '@core/dtos';
import {
  GetUserUseCase,
  UpdateProfileUseCase,
  ListUsersUseCase,
  ChangeStatusUseCase,
  DeleteUserUseCase,
} from '../../application/use-cases';

const logger = new Logger('UserController');

export class UserController {
  constructor(
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly changeStatusUseCase: ChangeStatusUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase
  ) {}

  getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const userId = req.params.userId;

      logger.debug('Get user request', {
        userId,
        requesterId: req.user.userId,
        correlationId: req.correlationId,
      });

      const result = await this.getUserUseCase.execute({
        userId,
        requesterId: req.user.userId,
      });

      ApiResponseUtil.success(res, result);
    } catch (error) {
      logger.error('Get user failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const userId = req.params.userId;

      // Users can only update their own profile
      if (userId !== req.user.userId) {
        throw new Error('Cannot update another user profile');
      }

      logger.info('Update profile request', {
        userId,
        correlationId: req.correlationId,
      });

      const result = await this.updateProfileUseCase.execute({
        userId,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      });

      logger.info('Profile updated successfully', {
        userId,
        correlationId: req.correlationId,
      });

      ApiResponseUtil.success(res, result, 'Profile updated successfully');
    } catch (error) {
      logger.error('Update profile failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      next(error);
    }
  };

  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      logger.debug('List users request', {
        query: req.query,
        correlationId: req.correlationId,
      });

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const pagination = PaginationDtoBuilder.build(page, limit);

      const result = await this.listUsersUseCase.execute({
        pagination,
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        emailVerified:
          req.query.emailVerified === 'true'
            ? true
            : req.query.emailVerified === 'false'
              ? false
              : undefined,
      });

      ApiResponseUtil.success(res, result.data, 'Users retrieved successfully', 200);
      // Note: meta is already in result, could enhance ApiResponseUtil to handle this
    } catch (error) {
      logger.error('List users failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      next(error);
    }
  };

  changeStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const userId = req.params.userId;

      logger.info('Change user status request', {
        userId,
        newStatus: req.body.status,
        changedBy: req.user.userId,
        correlationId: req.correlationId,
      });

      const result = await this.changeStatusUseCase.execute({
        userId,
        status: req.body.status,
        reason: req.body.reason,
        changedBy: req.user.userId,
      });

      logger.info('User status changed successfully', {
        userId,
        newStatus: req.body.status,
        correlationId: req.correlationId,
      });

      ApiResponseUtil.success(res, result, 'User status updated successfully');
    } catch (error) {
      logger.error('Change status failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const userId = req.params.userId;

      logger.info('Delete user request', {
        userId,
        deletedBy: req.user.userId,
        correlationId: req.correlationId,
      });

      await this.deleteUserUseCase.execute({
        userId,
        deletedBy: req.user.userId,
      });

      logger.info('User deleted successfully', {
        userId,
        correlationId: req.correlationId,
      });

      ApiResponseUtil.success(res, undefined, 'User deleted successfully');
    } catch (error) {
      logger.error('Delete user failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      next(error);
    }
  };
}
