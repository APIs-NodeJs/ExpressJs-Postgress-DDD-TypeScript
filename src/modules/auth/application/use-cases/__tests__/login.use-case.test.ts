// src/modules/auth/application/use-cases/__tests__/login.use-case.test.ts

import { LoginUseCase } from '../login.use-case';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { ISessionRepository } from '../../../domain/repositories/session.repository.interface';
import { User, UserStatus } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.value-object';
import { InvalidCredentialsError, ForbiddenError } from '@core/errors';
import { PasswordUtil } from '@core/utils';

jest.mock('@core/utils/password.util');

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockSessionRepository: jest.Mocked<ISessionRepository>;

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

    mockSessionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByRefreshToken: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByUserId: jest.fn(),
      revokeAllByUserId: jest.fn(),
      deleteExpired: jest.fn(),
    };

    loginUseCase = new LoginUseCase(mockUserRepository, mockSessionRepository);
  });

  describe('execute', () => {
    it('should successfully login a valid user', async () => {
      const input = {
        email: 'test@example.com',
        password: 'Password123!',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      };

      const user = User.create({
        email: Email.create('test@example.com'),
        passwordHash: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
        emailVerified: true,
      });

      mockUserRepository.findByEmail.mockResolvedValue(user);
      (PasswordUtil.compare as jest.Mock).mockResolvedValue(true);
      mockSessionRepository.save.mockImplementation(async (session) => session);
      mockUserRepository.update.mockImplementation(async (user) => user);

      const result = await loginUseCase.execute(input);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(mockSessionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should throw InvalidCredentialsError for non-existent user', async () => {
      const input = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(loginUseCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw InvalidCredentialsError for wrong password', async () => {
      const input = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      const user = User.create({
        email: Email.create('test@example.com'),
        passwordHash: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
        emailVerified: true,
      });

      mockUserRepository.findByEmail.mockResolvedValue(user);
      (PasswordUtil.compare as jest.Mock).mockResolvedValue(false);

      await expect(loginUseCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw ForbiddenError for unverified email', async () => {
      const input = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const user = User.create({
        email: Email.create('test@example.com'),
        passwordHash: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.PENDING_VERIFICATION,
        emailVerified: false,
      });

      mockUserRepository.findByEmail.mockResolvedValue(user);
      (PasswordUtil.compare as jest.Mock).mockResolvedValue(true);

      await expect(loginUseCase.execute(input)).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError for suspended user', async () => {
      const input = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const user = User.create({
        email: Email.create('test@example.com'),
        passwordHash: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.SUSPENDED,
        emailVerified: true,
      });

      mockUserRepository.findByEmail.mockResolvedValue(user);
      (PasswordUtil.compare as jest.Mock).mockResolvedValue(true);

      await expect(loginUseCase.execute(input)).rejects.toThrow(ForbiddenError);
    });
  });
});
