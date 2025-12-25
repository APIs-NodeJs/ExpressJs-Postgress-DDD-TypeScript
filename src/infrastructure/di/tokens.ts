export const TOKENS = {
  // Repositories
  IUserRepository: Symbol.for("IUserRepository"),
  IWorkspaceRepository: Symbol.for("IWorkspaceRepository"),

  // Services
  IPasswordHasher: Symbol.for("IPasswordHasher"),
  ITokenService: Symbol.for("ITokenService"),
  ITokenBlacklistService: Symbol.for("ITokenBlacklistService"),
  IAccountLockoutService: Symbol.for("IAccountLockoutService"),
  ISessionService: Symbol.for("ISessionService"),
  IEmailService: Symbol.for("IEmailService"),
  ILogger: Symbol.for("ILogger"),

  // Use Cases
  SignUpUseCase: Symbol.for("SignUpUseCase"),
  LoginUseCase: Symbol.for("LoginUseCase"),
  LogoutUseCase: Symbol.for("LogoutUseCase"),
  GetCurrentUserUseCase: Symbol.for("GetCurrentUserUseCase"),
  RefreshTokenUseCase: Symbol.for("RefreshTokenUseCase"),
  Enable2FAUseCase: Symbol.for("Enable2FAUseCase"),
  Verify2FAUseCase: Symbol.for("Verify2FAUseCase"),
  ForgotPasswordUseCase: Symbol.for("ForgotPasswordUseCase"),
  ResetPasswordUseCase: Symbol.for("ResetPasswordUseCase"),
  VerifyEmailUseCase: Symbol.for("VerifyEmailUseCase"),
  ResendVerificationUseCase: Symbol.for("ResendVerificationUseCase"),
};
