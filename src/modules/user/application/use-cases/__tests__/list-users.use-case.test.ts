// src/modules/user/application/use-cases/__tests__/list-users.use-case.test.ts

import { ListUsersUseCase } from '../list-users.use-case';
import { IUserQueryRepository } from '../../../domain/repositories/user-query.repository.interface';
import { User, UserStatus } from '@modules/auth/domain/entities/user.entity';
import { Email } from '@modules/auth/domain/value-objects/email.value-object';
import { PaginationDtoBuilder } from '@core/dtos';

describe('ListUsersUseCase', () => {
  let listUsersUseCase: ListUsersUseCase;
  let mockUserQueryRepository: jest.Mocked<IUserQueryRepository>;

  beforeEach(() => {
    mockUserQueryRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn(),
      count: jest.fn(),
      existsById: jest.fn(),
      existsByEmail: jest.fn(),
    };

    listUsersUseCase = new ListUsersUseCase(mockUserQueryRepository);
  });

  describe('execute', () => {
    it('should return paginated list of users', async () => {
      const users = [
        User.create({
          email: Email.create('user1@example.com'),
          passwordHash: 'hashed',
          firstName: 'User',
          lastName: 'One',
          status: UserStatus.ACTIVE,
          emailVerified: true,
        }),
        User.create({
          email: Email.create('user2@example.com'),
          passwordHash: 'hashed',
          firstName: 'User',
          lastName: 'Two',
          status: UserStatus.ACTIVE,
          emailVerified: true,
        }),
      ];

      mockUserQueryRepository.search.mockResolvedValue({
        users,
        total: 2,
      });

      const pagination = PaginationDtoBuilder.build(1, 10);

      const result = await listUsersUseCase.execute({
        pagination,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(mockUserQueryRepository.search).toHaveBeenCalledTimes(1);
    });

    it('should apply search filter', async () => {
      mockUserQueryRepository.search.mockResolvedValue({
        users: [],
        total: 0,
      });

      const pagination = PaginationDtoBuilder.build(1, 10);

      await listUsersUseCase.execute({
        pagination,
        search: 'john',
      });

      expect(mockUserQueryRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'john' }),
        pagination
      );
    });

    it('should apply status filter', async () => {
      mockUserQueryRepository.search.mockResolvedValue({
        users: [],
        total: 0,
      });

      const pagination = PaginationDtoBuilder.build(1, 10);

      await listUsersUseCase.execute({
        pagination,
        status: 'active',
      });

      expect(mockUserQueryRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' }),
        pagination
      );
    });
  });
});
