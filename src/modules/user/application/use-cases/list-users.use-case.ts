// src/modules/user/application/use-cases/list-users.use-case.ts

import { IUserQueryRepository } from '../../domain/repositories/user-query.repository.interface';
import { ListUsersRequestDto } from '../dtos/request';
import { UserListItemResponseDto } from '../dtos/response';
import { PaginatedResultDto, PaginationDtoBuilder } from '@core/dtos';
import { UserMapper } from '../mappers/user.mapper';

export class ListUsersUseCase {
  constructor(private readonly userQueryRepository: IUserQueryRepository) {}

  async execute(dto: ListUsersRequestDto): Promise<PaginatedResultDto<UserListItemResponseDto>> {
    const { users, total } = await this.userQueryRepository.search(
      {
        search: dto.search,
        status: dto.status,
        emailVerified: dto.emailVerified,
      },
      dto.pagination
    );

    const userDtos = UserMapper.toListItemDtoArray(users);

    return PaginationDtoBuilder.buildResult(userDtos, dto.pagination, total);
  }
}
