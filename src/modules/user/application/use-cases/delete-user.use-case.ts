// src/modules/user/application/use-cases/delete-user.use-case.ts

import { IUserRepository } from '@modules/auth/domain/repositories/user.repository.interface';
import { ISessionRepository } from '@modules/auth/domain/repositories/session.repository.interface';
import { NotFoundError } from '@core/errors';
import { DeleteUserRequestDto } from '../dtos/request';
import { UserDeletedEvent } from '../../domain/events/user-deleted.event';

export class DeleteUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository
  ) {}

  async execute(dto: DeleteUserRequestDto): Promise<void> {
    const user = await this.userRepository.findById(dto.userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isDeleted()) {
      throw new NotFoundError('User already deleted');
    }

    // Soft delete user
    user.softDelete();
    await this.userRepository.update(user);

    // Revoke all active sessions
    await this.sessionRepository.revokeAllByUserId(dto.userId);

    // Emit domain event
    const event = new UserDeletedEvent({
      userId: user.getId(),
      email: user.getEmail().getValue(),
      deletedAt: new Date(),
      deletedBy: dto.deletedBy,
    });
  }
}
