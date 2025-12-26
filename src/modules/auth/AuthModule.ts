import { UnitOfWork } from "../../core/infrastructure/persistence/UnitOfWork";
import { EventPublisher } from "../../core/infrastructure/messaging/EventPublisher";
import { UserRepository } from "./infrastructure/persistence/UserRepository";
import { WorkspaceRepository } from "./infrastructure/persistence/WorkspaceRepository";
import { BcryptHasher } from "./infrastructure/security/BcryptHasher";
import { JwtTokenService } from "./infrastructure/security/JwtTokenService";
import { SignUpHandler } from "./application/commands/handlers/SignUpHandler";
import { LoginHandler } from "./application/commands/handlers/LoginHandler";
import { GetUserHandler } from "./application/queries/handlers/GetUserHandler";
import { AuthApplicationService } from "./application/services/AuthApplicationService";
import { AuthController } from "./presentation/http/controllers/AuthController";
import { AuthMiddleware } from "./presentation/http/middlewares/AuthMiddleware";
import { createAuthRoutes } from "./presentation/routes/authRoutes";
import { Router } from "express";

export class AuthModule {
  private static instance: AuthModule;

  public readonly authController: AuthController;
  public readonly authMiddleware: AuthMiddleware;
  public readonly router: Router;

  private constructor() {
    // Infrastructure
    const unitOfWork = new UnitOfWork();
    const eventPublisher = new EventPublisher();
    const hasher = new BcryptHasher();
    const tokenService = new JwtTokenService(
      process.env.JWT_ACCESS_SECRET || "access-secret-key",
      process.env.JWT_REFRESH_SECRET || "refresh-secret-key"
    );

    // Repositories
    const userRepository = new UserRepository(unitOfWork);
    const workspaceRepository = new WorkspaceRepository(unitOfWork);

    // Handlers
    const signUpHandler = new SignUpHandler(
      userRepository,
      workspaceRepository,
      unitOfWork,
      eventPublisher,
      hasher
    );
    const loginHandler = new LoginHandler(
      userRepository,
      hasher,
      tokenService,
      eventPublisher
    );
    const getUserHandler = new GetUserHandler(userRepository);

    // Application Service
    const authService = new AuthApplicationService(
      signUpHandler,
      loginHandler,
      getUserHandler
    );

    // Presentation
    this.authController = new AuthController(authService);
    this.authMiddleware = new AuthMiddleware(tokenService);
    this.router = createAuthRoutes(this.authController, this.authMiddleware);
  }

  public static getInstance(): AuthModule {
    if (!AuthModule.instance) {
      AuthModule.instance = new AuthModule();
    }
    return AuthModule.instance;
  }
}
