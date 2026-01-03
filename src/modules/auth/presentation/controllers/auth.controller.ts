// src/modules/auth/presentation/controllers/auth.controller.ts

import { Request, Response, NextFunction } from 'express';
import { ApiResponseUtil } from '@core/utils';
import { Logger } from '@core/infrastructure/logger';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { GetCurrentUserUseCase } from '../../application/use-cases/get-current-user.use-case';

const logger = new Logger('AuthController');

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, firstName, lastName } = req.body;

      logger.info('User registration attempt', {
        email,
        correlationId: req.correlationId,
      });

      const result = await this.registerUseCase.execute({
        email,
        password,
        firstName,
        lastName,
      });

      logger.info('User registered successfully', {
        userId: result.userId,
        email: result.email,
        correlationId: req.correlationId,
      });

      ApiResponseUtil.created(
        res,
        result,
        'Registration successful. Please verify your email to activate your account.'
      );
    } catch (error) {
      logger.error('Registration failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      logger.info('User login attempt', {
        email,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });

      const result = await this.loginUseCase.execute({
        email,
        password,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      logger.info('User logged in successfully', {
        userId: result.user.id,
        email: result.user.email,
        correlationId: req.correlationId,
      });

      ApiResponseUtil.success(res, result, 'Login successful');
    } catch (error) {
      logger.error('Login failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      logger.info('Token refresh attempt', {
        correlationId: req.correlationId,
      });

      const result = await this.refreshTokenUseCase.execute({
        refreshToken,
      });

      logger.info('Token refreshed successfully', {
        correlationId: req.correlationId,
      });

      ApiResponseUtil.success(res, result, 'Token refreshed successfully');
    } catch (error) {
      logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      logger.info('User logout attempt', {
        userId: req.user?.userId,
        correlationId: req.correlationId,
      });

      await this.logoutUseCase.execute({
        refreshToken,
      });

      logger.info('User logged out successfully', {
        userId: req.user?.userId,
        correlationId: req.correlationId,
      });

      ApiResponseUtil.success(res, undefined, 'Logout successful');
    } catch (error) {
      logger.error('Logout failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      next(error);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      logger.debug('Get current user request', {
        userId: req.user.userId,
        correlationId: req.correlationId,
      });

      const result = await this.getCurrentUserUseCase.execute({
        userId: req.user.userId,
      });

      ApiResponseUtil.success(res, result);
    } catch (error) {
      logger.error('Get current user failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });
      next(error);
    }
  };
}
