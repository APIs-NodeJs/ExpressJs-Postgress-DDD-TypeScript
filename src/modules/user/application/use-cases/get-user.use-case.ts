// src/modules/user/application/use-cases/get-user.use-case.ts

import { IUserQueryRepository } from '../../domain/repositories/user-query.repository.interface';
import { NotFoundError, ForbiddenError } from '@core/errors';
import { GetUserRequestDto } from '../dtos/request';
import { UserDetailResponseDto } from '../dtos/response';
import { UserMapper } from '../mappers/user.mapper';

export class GetUserUseCase {
  constructor(private readonly userQueryRepository: IUserQueryRepository) {}

  async execute(dto: GetUserRequestDto): Promise<UserDetailResponseDto> {
    const user = await this.userQueryRepository.findById(dto.userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isDeleted()) {
      throw new NotFoundError('User has been deleted');
    }

    // Business rule: Users can only view active or their own profiles
    if (dto.requesterId !== dto.userId && user.getStatus() !== 'active') {
      throw new ForbiddenError('Cannot view inactive user profile');
    }

    return UserMapper.toDetailDto(user);
  }
}
