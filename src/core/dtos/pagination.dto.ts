// src/core/dtos/pagination.dto.ts

export interface PaginationDto {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResultDto<T> {
  data: T[];
  meta: PaginationMetaDto;
}

export class PaginationDtoBuilder {
  static build(page: number = 1, limit: number = 10): PaginationDto {
    const normalizedPage = Math.max(1, page);
    const normalizedLimit = Math.min(Math.max(1, limit), 100);
    const offset = (normalizedPage - 1) * normalizedLimit;

    return {
      page: normalizedPage,
      limit: normalizedLimit,
      offset,
    };
  }

  static buildMeta(pagination: PaginationDto, total: number): PaginationMetaDto {
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1,
    };
  }

  static buildResult<T>(
    data: T[],
    pagination: PaginationDto,
    total: number
  ): PaginatedResultDto<T> {
    return {
      data,
      meta: this.buildMeta(pagination, total),
    };
  }
}

// src/core/dtos/query.dto.ts

export interface QueryDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

export interface FilterDto {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like';
  value: string | number | boolean | Array<string | number>;
}

export interface SortDto {
  field: string;
  order: 'ASC' | 'DESC';
}

// src/core/dtos/id.dto.ts

export interface IdDto {
  id: string;
}

export interface IdsDto {
  ids: string[];
}

// src/core/dtos/timestamp.dto.ts

export interface TimestampDto {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeleteTimestampDto extends TimestampDto {
  deletedAt?: Date;
}

// src/core/dtos/index.ts

export * from './pagination.dto';
export * from './query.dto';
export * from './id.dto';
export * from './timestamp.dto';
