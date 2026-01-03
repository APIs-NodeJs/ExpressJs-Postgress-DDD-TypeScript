// src/modules/auth/presentation/controllers/auth.controller.ts

import { Request, Response, NextFunction } from 'express';
import { ApiResponseUtil } from '@core/utils';
import { Logger } from '@core/infrastructure/logger';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { GetCurrentUserUseCase } from '../../application/use-cases/get-current-user.use-case';
import {
  RegisterRequestDto,
  LoginRequestDto,
  RefreshTokenRequestDto,
  LogoutRequestDto,
  GetCurrentUserRequestDto,
} from '../../application/dtos';

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
      logger.info('User registration attempt', {
        email: req.body.email,
        correlationId: req.correlationId,
      });

      // Build DTO from request
      const dto: RegisterRequestDto = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      };

      const result = await this.registerUseCase.execute(dto);

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
      logger.info('User login attempt', {
        email: req.body.email,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });

      // Build DTO from request
      const dto: LoginRequestDto = {
        email: req.body.email,
        password: req.body.password,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      };

      const result = await this.loginUseCase.execute(dto);

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
      logger.info('Token refresh attempt', {
        correlationId: req.correlationId,
      });

      // Build DTO from request
      const dto: RefreshTokenRequestDto = {
        refreshToken: req.body.refreshToken,
      };

      const result = await this.refreshTokenUseCase.execute(dto);

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
      logger.info('User logout attempt', {
        userId: req.user?.userId,
        correlationId: req.correlationId,
      });

      // Build DTO from request
      const dto: LogoutRequestDto = {
        refreshToken: req.body.refreshToken,
      };

      await this.logoutUseCase.execute(dto);

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

      // Build DTO from request
      const dto: GetCurrentUserRequestDto = {
        userId: req.user.userId,
      };

      const result = await this.getCurrentUserUseCase.execute(dto);

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
