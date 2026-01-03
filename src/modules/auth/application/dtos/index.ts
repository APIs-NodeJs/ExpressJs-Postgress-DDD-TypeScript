// src/modules/auth/application/dtos/index.ts

// Request DTOs
export * from './request';

// Response DTOs
export * from './response';

// Re-export for convenience
export type {
  RegisterRequestDto,
  LoginRequestDto,
  RefreshTokenRequestDto,
  LogoutRequestDto,
  GetCurrentUserRequestDto,
  ChangePasswordRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  VerifyEmailRequestDto,
} from './request';

export type {
  UserResponseDto,
  RegisterResponseDto,
  LoginResponseDto,
  RefreshTokenResponseDto,
  SessionResponseDto,
} from './response';
