// src/modules/workspace/application/dtos/request/remove-member.request.dto.ts

export interface RemoveMemberRequestDto {
  workspaceId: string;
  userId: string;
  removedBy: string;
}
