// src/core/dtos/builders/dto.builder.ts

export abstract class DtoBuilder<TDto> {
  protected data: Partial<TDto> = {};

  abstract build(): TDto;

  reset(): this {
    this.data = {};
    return this;
  }

  with<K extends keyof TDto>(key: K, value: TDto[K]): this {
    this.data[key] = value;
    return this;
  }

  withMany(values: Partial<TDto>): this {
    Object.assign(this.data, values);
    return this;
  }
}
