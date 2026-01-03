// src/modules/auth/application/dtos/request/reset-password.request.dto.ts

export interface ResetPasswordRequestDto {
  token: string;
  newPassword: string;
}
