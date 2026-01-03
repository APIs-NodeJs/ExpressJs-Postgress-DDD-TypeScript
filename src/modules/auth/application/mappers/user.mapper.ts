// src/modules/auth/application/mappers/user.mapper.ts

import { User } from '../../domain/entities/user.entity';
import { Session } from '../../domain/entities/session.entity';
import { UserResponseDto, SessionResponseDto } from '../dtos/response';

export class UserMapper {
  static toDto(user: User): UserResponseDto {
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

  static toDtoList(users: User[]): UserResponseDto[] {
    return users.map((user) => this.toDto(user));
  }

  static toMinimalDto(user: User): {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
  } {
    return {
      id: user.getId(),
      email: user.getEmail().getValue(),
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      status: user.getStatus(),
    };
  }
}
