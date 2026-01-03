// src/modules/auth/application/dtos/request/change-password.request.dto.ts

export interface ChangePasswordRequestDto {
  userId: string;
  currentPassword: string;
  newPassword: string;
}
