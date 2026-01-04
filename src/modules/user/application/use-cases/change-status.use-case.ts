// src/modules/user/application/use-cases/change-status.use-case.ts

import { IUserRepository } from '@modules/auth/domain/repositories/user.repository.interface';
import { NotFoundError, ForbiddenError, ValidationError } from '@core/errors';
import { ChangeStatusRequestDto } from '../dtos/request';
import { UserDetailResponseDto } from '../dtos/response';
import { UserMapper } from '../mappers/user.mapper';
import { UserStatusChangedEvent } from '../../domain/events/user-status-changed.event';
import { UserStatus as UserStatusEnum } from '@modules/auth/domain/entities/user.entity';

export class ChangeStatusUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: ChangeStatusRequestDto): Promise<UserDetailResponseDto> {
    const user = await this.userRepository.findById(dto.userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isDeleted()) {
      throw new ForbiddenError('Cannot change status of deleted user');
    }

    const oldStatus = user.getStatus();

    // Validate status transition
    if (oldStatus === dto.status) {
      throw new ValidationError('User already has this status');
    }

    // Apply status change
    switch (dto.status) {
      case UserStatusEnum.ACTIVE:
        user.activate();
        break;
      case UserStatusEnum.INACTIVE:
        user.deactivate();
        break;
      case UserStatusEnum.SUSPENDED:
        user.suspend();
        break;
      default:
        throw new ValidationError('Invalid status');
    }

    const updatedUser = await this.userRepository.update(user);

    // Emit domain event
    const event = new UserStatusChangedEvent({
      userId: user.getId(),
      email: user.getEmail().getValue(),
      oldStatus,
      newStatus: dto.status,
      changedAt: new Date(),
      reason: dto.reason,
    });

    return UserMapper.toDetailDto(updatedUser);
  }
}
