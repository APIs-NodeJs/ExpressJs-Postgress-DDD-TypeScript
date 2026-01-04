// src/modules/workspace/application/dtos/request/add-member.request.dto.ts

export interface AddMemberRequestDto {
  workspaceId: string;
  userId: string;
  role: string;
  addedBy: string;
}
