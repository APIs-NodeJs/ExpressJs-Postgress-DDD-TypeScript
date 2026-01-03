// src/modules/auth/auth.container.ts

import { Router } from 'express';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { SessionRepository } from './infrastructure/repositories/session.repository';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { GetCurrentUserUseCase } from './application/use-cases/get-current-user.use-case';
import { AuthController } from './presentation/controllers/auth.controller';
import { createAuthRoutes } from './presentation/routes/auth.routes';

export class AuthContainer {
  private static userRepository: UserRepository;
  private static sessionRepository: SessionRepository;

  private static registerUseCase: RegisterUseCase;
  private static loginUseCase: LoginUseCase;
  private static refreshTokenUseCase: RefreshTokenUseCase;
  private static logoutUseCase: LogoutUseCase;
  private static getCurrentUserUseCase: GetCurrentUserUseCase;

  private static authController: AuthController;

  static initialize(): void {
    // Repositories
    this.userRepository = new UserRepository();
    this.sessionRepository = new SessionRepository();

    // Use Cases
    this.registerUseCase = new RegisterUseCase(this.userRepository);

    this.loginUseCase = new LoginUseCase(this.userRepository, this.sessionRepository);

    this.refreshTokenUseCase = new RefreshTokenUseCase(this.sessionRepository, this.userRepository);

    this.logoutUseCase = new LogoutUseCase(this.sessionRepository);

    this.getCurrentUserUseCase = new GetCurrentUserUseCase(this.userRepository);

    // Controllers
    this.authController = new AuthController(
      this.registerUseCase,
      this.loginUseCase,
      this.refreshTokenUseCase,
      this.logoutUseCase,
      this.getCurrentUserUseCase
    );
  }

  static getAuthRoutes(): Router {
    if (!this.authController) {
      this.initialize();
    }
    return createAuthRoutes(this.authController);
  }

  static getUserRepository(): UserRepository {
    if (!this.userRepository) {
      this.initialize();
    }
    return this.userRepository;
  }

  static getSessionRepository(): SessionRepository {
    if (!this.sessionRepository) {
      this.initialize();
    }
    return this.sessionRepository;
  }
}
