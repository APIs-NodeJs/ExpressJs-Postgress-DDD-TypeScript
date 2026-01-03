// src/core/dtos/transformers/dto.transformer.ts

export class DtoTransformer {
  /**
   * Transform array of entities to DTOs
   */
  static toArray<TEntity, TDto>(entities: TEntity[], mapper: (entity: TEntity) => TDto): TDto[] {
    return entities.map((entity) => mapper(entity));
  }

  /**
   * Transform entity to DTO or return null
   */
  static toNullable<TEntity, TDto>(
    entity: TEntity | null,
    mapper: (entity: TEntity) => TDto
  ): TDto | null {
    return entity ? mapper(entity) : null;
  }

  /**
   * Transform partial entity data
   */
  static toPartial<TDto extends Record<string, unknown>>(data: Partial<TDto>): Partial<TDto> {
    const result: Partial<TDto> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        result[key as keyof TDto] = value as TDto[keyof TDto];
      }
    });

    return result;
  }

  /**
   * Remove undefined and null values from DTO
   */
  static sanitize<T extends Record<string, unknown>>(dto: T): T {
    const sanitized = {} as T;

    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        sanitized[key as keyof T] = value as T[keyof T];
      }
    });

    return sanitized;
  }

  /**
   * Pick specific fields from DTO
   */
  static pick<T extends Record<string, unknown>, K extends keyof T>(dto: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;

    keys.forEach((key) => {
      if (key in dto) {
        result[key] = dto[key];
      }
    });

    return result;
  }

  /**
   * Omit specific fields from DTO
   */
  static omit<T extends Record<string, unknown>, K extends keyof T>(dto: T, keys: K[]): Omit<T, K> {
    const result = { ...dto };

    keys.forEach((key) => {
      delete result[key];
    });

    return result;
  }
}
