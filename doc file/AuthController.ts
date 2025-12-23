import { Request, Response, NextFunction } from 'express';
import { SignUpUseCase } from '../../application/use-cases/SignUpUseCase';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { GetCurrentUserUseCase } from '../../application/use-cases/GetCurrentUserUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshTokenUseCase';
import { AppError } from '../../../../shared/domain/AppError';
import { APP_CONSTANTS } from '../../../../config/constants';

export class AuthController {
  constructor(
    private signUpUseCase: SignUpUseCase,
    private loginUseCase: LoginUseCase,
    private getCurrentUserUseCase: GetCurrentUserUseCase,
    private refreshTokenUseCase: RefreshTokenUseCase
  ) {}

  signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.signUpUseCase.execute(req.body);

      if (result.isFailure) {
        throw AppError.badRequest(result.error!);
      }

      res.status(APP_CONSTANTS.HTTP_STATUS.CREATED).json({
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.loginUseCase.execute(req.body);

      if (result.isFailure) {
        throw AppError.unauthorized(result.error!);
      }

      res.status(APP_CONSTANTS.HTTP_STATUS.OK).json({
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getCurrentUserUseCase.execute({
        userId: req.user!.userId,
      });

      if (result.isFailure) {
        throw AppError.notFound(result.error!);
      }

      res.status(APP_CONSTANTS.HTTP_STATUS.OK).json({
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.refreshTokenUseCase.execute(req.body);

      if (result.isFailure) {
        throw AppError.unauthorized(result.error!);
      }

      res.status(APP_CONSTANTS.HTTP_STATUS.OK).json({
        data: result.value,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // In a real implementation, you would invalidate the token here
      // For now, we'll just return 204 No Content
      res.status(APP_CONSTANTS.HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  };
}
