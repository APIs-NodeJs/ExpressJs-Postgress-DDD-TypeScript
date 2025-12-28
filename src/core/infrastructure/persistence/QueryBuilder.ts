import { Op, WhereOptions } from 'sequelize';
import { Filter } from '../../../shared/types/FilterTypes';

export class QueryBuilder {
  static buildWhereClause(filters: Filter[]): WhereOptions {
    if (!filters || filters.length === 0) {
      return {};
    }

    const conditions: any = {};

    for (const filter of filters) {
      const condition = this.buildCondition(filter);
      if (condition) {
        conditions[filter.field] = condition;
      }
    }

    return conditions;
  }

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
        return { [Op.in]: value };
      case 'between':
        return { [Op.between]: value };
      case 'isNull':
        return { [Op.is]: null };
      case 'isNotNull':
        return { [Op.not]: null };
      default:
        return null;
    }
  }

  static buildOrderClause(
    sortField?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): [string, string][] | undefined {
    if (!sortField) {
      return undefined;
    }
    return [[sortField, sortOrder]];
  }
}