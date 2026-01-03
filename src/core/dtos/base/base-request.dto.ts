// src/core/dtos/base/base-request.dto.ts

export abstract class BaseRequestDto {
  constructor(data: Record<string, unknown>) {
    Object.assign(this, data);
  }
}
