// src/modules/auth/application/use-cases/get-current-user.use-case.ts

import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { NotFoundError, UnauthorizedError } from '@core/errors';
import { UserStatus } from '../../domain/entities/user.entity';

export interface GetCurrentUserUseCaseInput {
  userId: string;
}

export interface GetCurrentUserUseCaseOutput {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export class GetCurrentUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: GetCurrentUserUseCaseInput): Promise<GetCurrentUserUseCaseOutput> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isDeleted()) {
      throw new UnauthorizedError('User account has been deleted');
    }

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
}
