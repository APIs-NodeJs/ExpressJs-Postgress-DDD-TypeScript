import { Request, Response, NextFunction } from 'express';
import { SignUpUseCase } from '../../application/use-cases/SignUpUseCase';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { GetCurrentUserUseCase } from '../../application/use-cases/GetCurrentUserUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshTokenUseCase';
import { AppError } from '../../../../shared/domain/AppError';

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
      if (result.isFailure) throw AppError.badRequest(result.error!);
      res.status(201).json({ data: result.value });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.loginUseCase.execute(req.body);
      if (result.isFailure) throw AppError.unauthorized(result.error!);
      res.status(200).json({ data: result.value });
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getCurrentUserUseCase.execute({ userId: req.user!.userId });
      if (result.isFailure) throw AppError.notFound(result.error!);
      res.status(200).json({ data: result.value });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.refreshTokenUseCase.execute(req.body);
      if (result.isFailure) throw AppError.unauthorized(result.error!);
      res.status(200).json({ data: result.value });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    res.status(204).send();
  };
}
