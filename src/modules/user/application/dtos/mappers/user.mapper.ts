// src/modules/user/application/mappers/user.mapper.ts

import { User } from '@modules/auth/domain/entities/user.entity';
import { UserDetailResponseDto, UserListItemResponseDto } from '../dtos/response';

export class UserMapper {
  static toDetailDto(user: User): UserDetailResponseDto {
    return {
      id: user.getId(),
      email: user.getEmail().getValue(),
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      fullName: user.getFullName(),
      status: user.getStatus(),
      emailVerified: user.isEmailVerified(),
      lastLoginAt: user.getLastLoginAt(),
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt(),
    };
  }

  static toListItemDto(user: User): UserListItemResponseDto {
    return {
      id: user.getId(),
      email: user.getEmail().getValue(),
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      fullName: user.getFullName(),
      status: user.getStatus(),
      emailVerified: user.isEmailVerified(),
      lastLoginAt: user.getLastLoginAt(),
      createdAt: user.getCreatedAt(),
    };
  }

  static toListItemDtoArray(users: User[]): UserListItemResponseDto[] {
    return users.map((user) => this.toListItemDto(user));
  }
}
