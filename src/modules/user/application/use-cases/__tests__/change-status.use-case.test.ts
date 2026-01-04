// src/modules/user/application/use-cases/__tests__/change-status.use-case.test.ts

import { ChangeStatusUseCase } from '../change-status.use-case';
import { IUserRepository } from '@modules/auth/domain/repositories/user.repository.interface';
import { User, UserStatus } from '@modules/auth/domain/entities/user.entity';
import { Email } from '@modules/auth/domain/value-objects/email.value-object';
import { NotFoundError, ForbiddenError, ValidationError } from '@core/errors';

describe('ChangeStatusUseCase', () => {
  let changeStatusUseCase: ChangeStatusUseCase;
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

    changeStatusUseCase = new ChangeStatusUseCase(mockUserRepository);
  });

  describe('execute', () => {
    it('should successfully change user status to suspended', async () => {
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

      const result = await changeStatusUseCase.execute({
        userId: user.getId(),
        status: UserStatus.SUSPENDED,
        changedBy: 'admin-id',
        reason: 'Violation of terms',
      });

      expect(result.status).toBe(UserStatus.SUSPENDED);
      expect(mockUserRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError if user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        changeStatusUseCase.execute({
          userId: 'non-existent-id',
          status: UserStatus.SUSPENDED,
          changedBy: 'admin-id',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if status is the same', async () => {
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
        changeStatusUseCase.execute({
          userId: user.getId(),
          status: UserStatus.ACTIVE,
          changedBy: 'admin-id',
        })
      ).rejects.toThrow(ValidationError);
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
        changeStatusUseCase.execute({
          userId: user.getId(),
          status: UserStatus.SUSPENDED,
          changedBy: 'admin-id',
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
