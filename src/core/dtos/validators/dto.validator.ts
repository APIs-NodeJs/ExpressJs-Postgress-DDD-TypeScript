// src/core/dtos/validators/dto.validator.ts

import { z, ZodSchema } from 'zod';
import { ValidationError } from '@core/errors';

export class DtoValidator {
  static validate<T>(schema: ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
        throw new ValidationError(messages.join(', '));
      }
      throw error;
    }
  }

  static validateAsync<T>(schema: ZodSchema<T>, data: unknown): Promise<T> {
    return schema.parseAsync(data).catch((error) => {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
        throw new ValidationError(messages.join(', '));
      }
      throw error;
    });
  }
}
