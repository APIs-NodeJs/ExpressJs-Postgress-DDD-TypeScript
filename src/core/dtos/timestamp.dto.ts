// src/core/dtos/timestamp.dto.ts

export interface TimestampDto {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeleteTimestampDto extends TimestampDto {
  deletedAt?: Date;
}
