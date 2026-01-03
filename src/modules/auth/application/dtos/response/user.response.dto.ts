// src/modules/auth/application/dtos/response/user.response.dto.ts

import { UserStatus } from '../../../domain/entities/user.entity';

export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
