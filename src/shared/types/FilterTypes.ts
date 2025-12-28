export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'in'
  | 'between'
  | 'isNull'
  | 'isNotNull';

export interface Filter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export class FilterBuilder {
  private filters: Filter[] = [];

  equals(field: string, value: any): this {
    this.filters.push({ field, operator: 'eq', value });
    return this;
  }

  notEquals(field: string, value: any): this {
    this.filters.push({ field, operator: 'ne', value });
    return this;
  }

  greaterThan(field: string, value: any): this {
    this.filters.push({ field, operator: 'gt', value });
    return this;
  }

  lessThan(field: string, value: any): this {
    this.filters.push({ field, operator: 'lt', value });
    return this;
  }

  like(field: string, value: string): this {
    this.filters.push({ field, operator: 'like', value });
    return this;
  }

  in(field: string, values: any[]): this {
    this.filters.push({ field, operator: 'in', value: values });
    return this;
  }

  isNull(field: string): this {
    this.filters.push({ field, operator: 'isNull', value: null });
    return this;
  }

  build(): Filter[] {
    return this.filters;
  }
}
