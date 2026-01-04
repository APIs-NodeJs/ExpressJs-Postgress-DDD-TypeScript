// src/modules/workspace/application/dtos/response/workspace.response.dto.ts

export interface CreateWorkspaceResponseDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  status: string;
  createdAt: Date;
}

export interface WorkspaceDetailResponseDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  status: string;
  memberRole: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceListItemResponseDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  memberRole: string;
  memberCount?: number;
  createdAt: Date;
}
