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
