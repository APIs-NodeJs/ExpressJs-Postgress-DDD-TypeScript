// src/modules/auth/application/dtos/response/register.response.dto.ts

import { UserStatus } from '../../../domain/entities/user.entity';

export interface RegisterResponseDto {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
}
