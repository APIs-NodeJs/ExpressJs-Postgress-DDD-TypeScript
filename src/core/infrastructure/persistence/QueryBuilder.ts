// src/core/infrastructure/persistence/QueryBuilder.ts
import { Op, WhereOptions, Order } from 'sequelize';
import { Filter } from '../../../shared/types/FilterTypes';

export interface QueryOptions {
  filters?: Filter[];
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
  search?: {
    fields: string[];
    term: string;
  };
}

export interface QueryResult {
  where: WhereOptions;
  order?: Order;
  limit?: number;
  offset?: number;
}

export class QueryBuilder {
  /**
   * Build complete Sequelize query from options
   */
  static build(options: QueryOptions): QueryResult {
    const result: QueryResult = {
      where: this.buildWhereClause(options.filters || []),
    };

    // Add search conditions
    if (options.search && options.search.term) {
      result.where = {
        ...result.where,
        [Op.or]: this.buildSearchConditions(options.search.fields, options.search.term),
      };
    }

    // Add ordering
    if (options.sortField) {
      result.order = this.buildOrderClause(options.sortField, options.sortOrder);
    }

    // Add pagination
    if (options.page && options.limit) {
      result.limit = options.limit;
      result.offset = (options.page - 1) * options.limit;
    }

    return result;
  }

  /**
   * Build WHERE clause from filters
   */
  static buildWhereClause(filters: Filter[]): WhereOptions {
    if (!filters || filters.length === 0) {
      return {};
    }

    const conditions: any = {};

    for (const filter of filters) {
      const condition = this.buildCondition(filter);
      if (condition) {
        // Handle multiple filters on same field
        if (conditions[filter.field]) {
          conditions[filter.field] = {
            [Op.and]: [conditions[filter.field], condition],
          };
        } else {
          conditions[filter.field] = condition;
        }
      }
    }

    return conditions;
  }

  /**
   * Build single filter condition
   */
  private static buildCondition(filter: Filter): any {
    const { operator, value } = filter;

    switch (operator) {
      case 'eq':
        return { [Op.eq]: value };
      case 'ne':
        return { [Op.ne]: value };
      case 'gt':
        return { [Op.gt]: value };
      case 'gte':
        return { [Op.gte]: value };
      case 'lt':
        return { [Op.lt]: value };
      case 'lte':
        return { [Op.lte]: value };
      case 'like':
        return { [Op.like]: `%${value}%` };
      case 'in':
        return { [Op.in]: Array.isArray(value) ? value : [value] };
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          return { [Op.between]: value };
        }
        return null;
      case 'isNull':
        return { [Op.is]: null };
      case 'isNotNull':
        return { [Op.not]: null };
      default:
        return null;
    }
  }

  /**
   * Build ORDER clause
   */
  static buildOrderClause(sortField: string, sortOrder: 'ASC' | 'DESC' = 'DESC'): Order {
    return [[sortField, sortOrder]];
  }

  /**
   * Build search conditions for multiple fields
   */
  private static buildSearchConditions(fields: string[], term: string): WhereOptions[] {
    return fields.map(field => ({
      [field]: { [Op.like]: `%${term}%` },
    }));
  }

  /**
   * Build date range filter
   */
  static buildDateRange(field: string, startDate: Date, endDate: Date): Filter {
    return {
      field,
      operator: 'between',
      value: [startDate, endDate],
    };
  }

  /**
   * Build text search filter
   */
  static buildTextSearch(field: string, term: string): Filter {
    return {
      field,
      operator: 'like',
      value: term,
    };
  }

  /**
   * Build "in" filter
   */
  static buildInFilter(field: string, values: any[]): Filter {
    return {
      field,
      operator: 'in',
      value: values,
    };
  }
}
