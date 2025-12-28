export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface SortParams {
  field: string;
  order: 'ASC' | 'DESC';
}

export interface FilterParams {
  [key: string]: any;
}

export interface PaginatedQuery {
  pagination: PaginationParams;
  sort?: SortParams;
  filters?: FilterParams;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class PaginationHelper {
  static createParams(page: number = 1, limit: number = 20): PaginationParams {
    const normalizedPage = Math.max(1, page);
    const normalizedLimit = Math.min(Math.max(1, limit), 100);

    return {
      page: normalizedPage,
      limit: normalizedLimit,
      offset: (normalizedPage - 1) * normalizedLimit,
    };
  }

  static createMeta(
    page: number,
    limit: number,
    total: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
