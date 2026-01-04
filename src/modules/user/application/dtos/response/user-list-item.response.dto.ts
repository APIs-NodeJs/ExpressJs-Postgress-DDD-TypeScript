// src/modules/user/application/dtos/response/user-list-item.response.dto.ts

export interface UserListItemResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: string;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}
