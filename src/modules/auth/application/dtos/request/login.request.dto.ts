// src/modules/auth/application/dtos/request/login.request.dto.ts

export interface LoginRequestDto {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}
