// src/core/dtos/base/base-response.dto.ts

import { TimestampDto } from '../timestamp.dto';

export abstract class BaseResponseDto implements TimestampDto {
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export abstract class BaseSoftDeleteResponseDto extends BaseResponseDto {
  deletedAt?: Date;
}
