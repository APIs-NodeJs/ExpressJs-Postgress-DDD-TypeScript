// src/modules/user/application/dtos/response/user-detail.response.dto.ts

export interface UserDetailResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: string;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
