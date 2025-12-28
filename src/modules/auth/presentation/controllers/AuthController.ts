// src/modules/auth/presentation/controllers/AuthController.ts
import { Request, Response } from 'express';
import { ResponseHandler } from '../../../../shared/responses/ResponseHandler';
import { RegisterUserUseCase } from '../../application/useCases/RegisterUserUseCase';
import { LoginUserUseCase } from '../../application/useCases/LoginUserUseCase';
import { GoogleAuthUseCase } from '../../application/useCases/GoogleAuthUseCase';
import { RefreshTokenUseCase } from '../../application/useCases/RefreshTokenUseCase';
import { GoogleOAuthProvider } from '../../infrastructure/GoogleOAuthProvider';

export class AuthController {
  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    private loginUserUseCase: LoginUserUseCase,
    private googleAuthUseCase: GoogleAuthUseCase,
    private refreshTokenUseCase: RefreshTokenUseCase
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    const requestId = req.id;

    const result = await this.registerUserUseCase.execute(req.body);

    if (result.isFailure) {
      ResponseHandler.error(
        res,
        400,
        'REGISTRATION_FAILED',
        result.getErrorValue(),
        undefined,
        requestId
      );
      return;
    }

    const data = result.getValue();
    ResponseHandler.created(res, data, 'User registered successfully', requestId);
  }

  async login(req: Request, res: Response): Promise<void> {
    const requestId = req.id;

    const result = await this.loginUserUseCase.execute(req.body);

    if (result.isFailure) {
      ResponseHandler.error(
        res,
        401,
        'LOGIN_FAILED',
        result.getErrorValue(),
        undefined,
        requestId
      );
      return;
    }

    const data = result.getValue();
    ResponseHandler.ok(res, data, 'Login successful', requestId);
  }

  async googleAuthUrl(req: Request, res: Response): Promise<void> {
    const requestId = req.id;
    const state = Math.random().toString(36).substring(7);

    const authUrl = GoogleOAuthProvider.getAuthorizationUrl(state);

    ResponseHandler.ok(res, { authUrl, state }, 'Google OAuth URL generated', requestId);
  }

  async googleAuthCallback(req: Request, res: Response): Promise<void> {
    const requestId = req.id;

    const result = await this.googleAuthUseCase.execute({
      code: req.body.code,
    });

    if (result.isFailure) {
      ResponseHandler.error(
        res,
        400,
        'GOOGLE_AUTH_FAILED',
        result.getErrorValue(),
        undefined,
        requestId
      );
      return;
    }

    const data = result.getValue();

    if (data.isNewUser) {
      ResponseHandler.created(res, data, 'User registered via Google', requestId);
    } else {
      ResponseHandler.ok(res, data, 'Login via Google successful', requestId);
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const requestId = req.id;

    const result = await this.refreshTokenUseCase.execute({
      refreshToken: req.body.refreshToken,
    });

    if (result.isFailure) {
      ResponseHandler.error(
        res,
        401,
        'REFRESH_TOKEN_FAILED',
        result.getErrorValue(),
        undefined,
        requestId
      );
      return;
    }

    const data = result.getValue();
    ResponseHandler.ok(res, data, 'Tokens refreshed successfully', requestId);
  }

  async logout(req: Request, res: Response): Promise<void> {
    const requestId = req.id;

    ResponseHandler.ok(
      res,
      { message: 'Logged out successfully' },
      'Logout successful',
      requestId
    );
  }
}
