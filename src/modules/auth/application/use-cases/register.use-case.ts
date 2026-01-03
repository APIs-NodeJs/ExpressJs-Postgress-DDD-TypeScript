// src/modules/auth/application/use-cases/register.use-case.ts

import { User, UserStatus } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { ConflictError } from '@core/errors';
import { PasswordUtil } from '@core/utils';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';
import { RegisterRequestDto, RegisterResponseDto } from '../dtos';

export class RegisterUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    // Validate and create value objects
    const email = Email.create(dto.email);
    const password = Password.create(dto.password);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await PasswordUtil.hash(password.getValue());

    // Create user entity
    const user = User.create({
      email,
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      status: UserStatus.PENDING_VERIFICATION,
      emailVerified: false,
    });

    // Save to repository
    const savedUser = await this.userRepository.save(user);

    // Emit domain event (would be handled by event bus)
    const event = new UserRegisteredEvent({
      userId: savedUser.getId(),
      email: savedUser.getEmail().getValue(),
      firstName: savedUser.getFirstName(),
      lastName: savedUser.getLastName(),
      registeredAt: savedUser.getCreatedAt(),
    });

    // Return DTO
    return {
      userId: savedUser.getId(),
      email: savedUser.getEmail().getValue(),
      firstName: savedUser.getFirstName(),
      lastName: savedUser.getLastName(),
      status: savedUser.getStatus(),
    };
  }
}
