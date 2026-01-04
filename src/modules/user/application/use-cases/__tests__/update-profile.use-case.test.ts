// src/modules/user/application/use-cases/__tests__/update-profile.use-case.test.ts

import { UpdateProfileUseCase } from '../update-profile.use-case';
import { IUserRepository } from '@modules/auth/domain/repositories/user.repository.interface';
import { User, UserStatus } from '@modules/auth/domain/entities/user.entity';
import { Email } from '@modules/auth/domain/value-objects/email.value-object';
import { NotFoundError, ForbiddenError, ValidationError } from '@core/errors';

describe('UpdateProfileUseCase', () => {
  let updateProfileUseCase: UpdateProfileUseCase;
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

    updateProfileUseCase = new UpdateProfileUseCase(mockUserRepository);
  });

  describe('execute', () => {
    it('should successfully update user profile', async () => {
      const user = User.create({
        email: Email.create('test@example.com'),
        passwordHash: 'hashed',
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
        emailVerified: true,
      });

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.update.mockImplementation(async (u) => u);

      const result = await updateProfileUseCase.execute({
        userId: user.getId(),
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(mockUserRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should update only first name', async () => {
      const user = User.create({
        email: Email.create('test@example.com'),
        passwordHash: 'hashed',
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
        emailVerified: true,
      });

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.update.mockImplementation(async (u) => u);

      const result = await updateProfileUseCase.execute({
        userId: user.getId(),
        firstName: 'Jane',
      });

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Doe');
    });

    it('should throw NotFoundError if user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        updateProfileUseCase.execute({
          userId: 'non-existent-id',
          firstName: 'Jane',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError for deleted user', async () => {
      const user = User.create({
        email: Email.create('test@example.com'),
        passwordHash: 'hashed',
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
        emailVerified: true,
      });
      user.softDelete();

      mockUserRepository.findById.mockResolvedValue(user);

      await expect(
        updateProfileUseCase.execute({
          userId: user.getId(),
          firstName: 'Jane',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ValidationError when no fields provided', async () => {
      const user = User.create({
        email: Email.create('test@example.com'),
        passwordHash: 'hashed',
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
        emailVerified: true,
      });

      mockUserRepository.findById.mockResolvedValue(user);

      await expect(
        updateProfileUseCase.execute({
          userId: user.getId(),
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});
