// src/modules/workspace/application/dtos/request/create-workspace.request.dto.ts

export interface CreateWorkspaceRequestDto {
  name: string;
  description?: string;
  ownerId: string;
}
