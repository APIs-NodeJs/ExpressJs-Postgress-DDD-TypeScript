// src/modules/user/application/use-cases/update-profile.use-case.ts

import { IUserRepository } from '@modules/auth/domain/repositories/user.repository.interface';
import { NotFoundError, ForbiddenError, ValidationError } from '@core/errors';
import { UpdateProfileRequestDto } from '../dtos/request';
import { UserDetailResponseDto } from '../dtos/response';
import { UserMapper } from '../mappers/user.mapper';
import { UserProfileUpdatedEvent } from '../../domain/events/user-profile-updated.event';

export class UpdateProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: UpdateProfileRequestDto): Promise<UserDetailResponseDto> {
    const user = await this.userRepository.findById(dto.userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isDeleted()) {
      throw new ForbiddenError('Cannot update deleted user profile');
    }

    if (!dto.firstName && !dto.lastName) {
      throw new ValidationError('At least one field must be provided for update');
    }

    // Track changes for event
    const changes: {
      firstName?: { old: string; new: string };
      lastName?: { old: string; new: string };
    } = {};

    const oldFirstName = user.getFirstName();
    const oldLastName = user.getLastName();

    const newFirstName = dto.firstName?.trim() || oldFirstName;
    const newLastName = dto.lastName?.trim() || oldLastName;

    if (dto.firstName && newFirstName !== oldFirstName) {
      changes.firstName = { old: oldFirstName, new: newFirstName };
    }

    if (dto.lastName && newLastName !== oldLastName) {
      changes.lastName = { old: oldLastName, new: newLastName };
    }

    // Update profile
    user.updateProfile(newFirstName, newLastName);
    const updatedUser = await this.userRepository.update(user);

    // Emit domain event
    if (Object.keys(changes).length > 0) {
      const event = new UserProfileUpdatedEvent({
        userId: user.getId(),
        email: user.getEmail().getValue(),
        changes,
        updatedAt: new Date(),
      });
    }

    return UserMapper.toDetailDto(updatedUser);
  }
}
