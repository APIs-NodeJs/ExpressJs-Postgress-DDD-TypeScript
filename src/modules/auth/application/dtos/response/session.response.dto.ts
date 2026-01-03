// src/modules/auth/application/dtos/response/session.response.dto.ts

export interface SessionResponseDto {
  id: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
}
