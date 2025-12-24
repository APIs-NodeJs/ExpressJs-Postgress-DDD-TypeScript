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

// Use Cases
import { SignUpUseCase } from "../../modules/auth/application/use-cases/SignUpUseCase";
import { LoginUseCase } from "../../modules/auth/application/use-cases/LoginUseCase";
import { GetCurrentUserUseCase } from "../../modules/auth/application/use-cases/GetCurrentUserUseCase";
import { RefreshTokenUseCase } from "../../modules/auth/application/use-cases/RefreshTokenUseCase";

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

  // Register use cases
  container.register(TOKENS.SignUpUseCase, {
    useClass: SignUpUseCase,
  });

  container.register(TOKENS.LoginUseCase, {
    useClass: LoginUseCase,
  });

  container.register(TOKENS.GetCurrentUserUseCase, {
    useClass: GetCurrentUserUseCase,
  });

  container.register(TOKENS.RefreshTokenUseCase, {
    useClass: RefreshTokenUseCase,
  });

  console.log("✅ DI Container configured");
}

export { container };
