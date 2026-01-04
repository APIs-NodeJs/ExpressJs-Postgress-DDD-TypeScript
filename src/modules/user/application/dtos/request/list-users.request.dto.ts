// src/modules/user/application/dtos/request/list-users.request.dto.ts

import { PaginationDto } from '@core/dtos';

export interface ListUsersRequestDto {
  pagination: PaginationDto;
  search?: string;
  status?: string;
  emailVerified?: boolean;
}
