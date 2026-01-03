// src/modules/auth/application/use-cases/__tests__/register.use-case.test.ts

import { RegisterUseCase } from '../register.use-case';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User, UserStatus } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.value-object';
import { ConflictError, ValidationError } from '@core/errors';

describe('RegisterUseCase', () => {
  let registerUseCase: RegisterUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      existsByEmail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
    };

    registerUseCase = new RegisterUseCase(mockUserRepository);
  });

  describe('execute', () => {
    it('should successfully register a new user', async () => {
      const input = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockImplementation(async (user: User) => user);

      const result = await registerUseCase.execute(input);

      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.status).toBe(UserStatus.PENDING_VERIFICATION);
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictError if email already exists', async () => {
      const input = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const existingUser = User.create({
        email: Email.create('existing@example.com'),
        passwordHash: 'hashed',
        firstName: 'Existing',
        lastName: 'User',
        status: UserStatus.ACTIVE,
        emailVerified: true,
      });

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(registerUseCase.execute(input)).rejects.toThrow(ConflictError);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid email', async () => {
      const input = {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      await expect(registerUseCase.execute(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for weak password', async () => {
      const input = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      };

      await expect(registerUseCase.execute(input)).rejects.toThrow(ValidationError);
    });

    it('should normalize email to lowercase', async () => {
      const input = {
        email: 'Test@EXAMPLE.COM',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockImplementation(async (user: User) => user);

      const result = await registerUseCase.execute(input);

      expect(result.email).toBe('test@example.com');
    });
  });
});
