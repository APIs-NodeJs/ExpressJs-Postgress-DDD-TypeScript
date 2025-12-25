import "reflect-metadata";
import { container } from "tsyringe";
import { TOKENS } from "./tokens";

// Repositories
import { IUserRepository } from "../../modules/auth/domain/repositories/IUserRepository";
import { UserRepository } from "../../modules/auth/infrastructure/repositories/UserRepository";
import { IWorkspaceRepository } from "../../modules/auth/domain/repositories/IWorkspaceRepository";
import { WorkspaceRepository } from "../../modules/auth/infrastructure/repositories/WorkspaceRepository";

// Services
import { IPasswordHasher } from "../../modules/auth/domain/services/IPasswordHasher";
import { PasswordHasher } from "../../modules/auth/infrastructure/security/PasswordHasher";
import { ITokenService } from "../../modules/auth/domain/services/ITokenService";
import { TokenService } from "../../modules/auth/infrastructure/security/TokenService";
import { ITokenBlacklistService } from "../../modules/auth/domain/services/ITokenBlacklistService";
import { InMemoryTokenBlacklistService } from "../../modules/auth/infrastructure/security/InMemoryTokenBlacklistService";
import { IAccountLockoutService } from "../../modules/auth/domain/services/IAccountLockoutService";
import { AccountLockoutService } from "../../modules/auth/infrastructure/security/AccountLockoutService";
import { ISessionService } from "../../modules/auth/domain/services/ISessionService";
import { SessionService } from "../../modules/auth/infrastructure/session/SessionService";
import { IEmailService } from "../../shared/infrastructure/email/IEmailService";
import { MockEmailService } from "../../shared/infrastructure/email/MockEmailService";

// Use Cases
import { SignUpUseCase } from "../../modules/auth/application/use-cases/SignUpUseCase";
import { LoginUseCase } from "../../modules/auth/application/use-cases/LoginUseCase";
import { LogoutUseCase } from "../../modules/auth/application/use-cases/LogoutUseCase";
import { GetCurrentUserUseCase } from "../../modules/auth/application/use-cases/GetCurrentUserUseCase";
import { RefreshTokenUseCase } from "../../modules/auth/application/use-cases/RefreshTokenUseCase";
import { Enable2FAUseCase } from "../../modules/auth/application/use-cases/Enable2FAUseCase";
import { Verify2FAUseCase } from "../../modules/auth/application/use-cases/Verify2FAUseCase";
import { ForgotPasswordUseCase } from "../../modules/auth/application/use-cases/ForgotPasswordUseCase";
import { ResetPasswordUseCase } from "../../modules/auth/application/use-cases/ResetPasswordUseCase";
import { VerifyEmailUseCase } from "../../modules/auth/application/use-cases/VerifyEmailUseCase";
import { ResendVerificationUseCase } from "../../modules/auth/application/use-cases/ResendVerificationUseCase";

// Event Handlers
import { UserEventHandlers } from "../../modules/auth/infrastructure/event-handlers/UserEventHandlers";

export function setupContainer(): void {
  // Register repositories
  container.register<IUserRepository>(TOKENS.IUserRepository, {
    useClass: UserRepository,
  });

  container.register<IWorkspaceRepository>(TOKENS.IWorkspaceRepository, {
    useClass: WorkspaceRepository,
  });

  // Register services
  container.register<IPasswordHasher>(TOKENS.IPasswordHasher, {
    useClass: PasswordHasher,
  });

  container.register<ITokenService>(TOKENS.ITokenService, {
    useClass: TokenService,
  });

  container.register<ITokenBlacklistService>(TOKENS.ITokenBlacklistService, {
    useClass: InMemoryTokenBlacklistService,
  });

  container.register<IAccountLockoutService>(TOKENS.IAccountLockoutService, {
    useClass: AccountLockoutService,
  });

  container.register<ISessionService>(TOKENS.ISessionService, {
    useClass: SessionService,
  });

  container.register<IEmailService>(TOKENS.IEmailService, {
    useClass: MockEmailService,
  });

  // Register use cases
  container.register(TOKENS.SignUpUseCase, {
    useClass: SignUpUseCase,
  });

  container.register(TOKENS.LoginUseCase, {
    useClass: LoginUseCase,
  });

  container.register(TOKENS.LogoutUseCase, {
    useClass: LogoutUseCase,
  });

  container.register(TOKENS.GetCurrentUserUseCase, {
    useClass: GetCurrentUserUseCase,
  });

  container.register(TOKENS.RefreshTokenUseCase, {
    useClass: RefreshTokenUseCase,
  });

  container.register(TOKENS.Enable2FAUseCase, {
    useClass: Enable2FAUseCase,
  });

  container.register(TOKENS.Verify2FAUseCase, {
    useClass: Verify2FAUseCase,
  });

  container.register(TOKENS.ForgotPasswordUseCase, {
    useClass: ForgotPasswordUseCase,
  });

  container.register(TOKENS.ResetPasswordUseCase, {
    useClass: ResetPasswordUseCase,
  });

  container.register(TOKENS.VerifyEmailUseCase, {
    useClass: VerifyEmailUseCase,
  });

  container.register(TOKENS.ResendVerificationUseCase, {
    useClass: ResendVerificationUseCase,
  });

  // Register event handlers
  UserEventHandlers.register();

  console.log("✅ DI Container configured with all services");
}

export { container };
