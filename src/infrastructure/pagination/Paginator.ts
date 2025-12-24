export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class Paginator {
  static async paginate<T>(
    query: any,
    options: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    const page = Math.max(1, options.page);
    const limit = Math.min(100, Math.max(1, options.limit));
    const offset = (page - 1) * limit;

    const { count, rows } = await query.findAndCountAll({
      limit,
      offset,
    });

    return {
      data: rows,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: page * limit < count,
        hasPrev: page > 1,
      },
    };
  }
}
