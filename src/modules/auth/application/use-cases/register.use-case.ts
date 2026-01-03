// src/modules/auth/application/use-cases/register.use-case.ts

import { User, UserStatus } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { Password } from '../../domain/value-objects/password.value-object';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { ConflictError } from '@core/errors';
import { PasswordUtil } from '@core/utils';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';

export interface RegisterUseCaseInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterUseCaseOutput {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
}

export class RegisterUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: RegisterUseCaseInput): Promise<RegisterUseCaseOutput> {
    // Validate and create value objects
    const email = Email.create(input.email);
    const password = Password.create(input.password);

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
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
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

    return {
      userId: savedUser.getId(),
      email: savedUser.getEmail().getValue(),
      firstName: savedUser.getFirstName(),
      lastName: savedUser.getLastName(),
      status: savedUser.getStatus(),
    };
  }
}
