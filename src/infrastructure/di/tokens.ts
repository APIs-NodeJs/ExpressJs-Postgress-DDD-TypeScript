export const TOKENS = {
  // Repositories
  IUserRepository: Symbol.for("IUserRepository"),
  IWorkspaceRepository: Symbol.for("IWorkspaceRepository"),

  // Services
  IPasswordHasher: Symbol.for("IPasswordHasher"),
  ITokenService: Symbol.for("ITokenService"),
  ILogger: Symbol.for("ILogger"),

  // Use Cases
  SignUpUseCase: Symbol.for("SignUpUseCase"),
  LoginUseCase: Symbol.for("LoginUseCase"),
  GetCurrentUserUseCase: Symbol.for("GetCurrentUserUseCase"),
  RefreshTokenUseCase: Symbol.for("RefreshTokenUseCase"),
};
