// src/modules/user/application/dtos/request/change-status.request.dto.ts

export interface ChangeStatusRequestDto {
  userId: string;
  status: string;
  reason?: string;
  changedBy: string;
}
