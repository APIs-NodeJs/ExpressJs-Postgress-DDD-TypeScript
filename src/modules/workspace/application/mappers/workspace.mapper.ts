// src/modules/workspace/application/mappers/workspace.mapper.ts

import { Workspace } from '../../domain/entities/workspace.entity';
import { WorkspaceRole } from '../../domain/value-objects/workspace-role.value-object';
import {
  CreateWorkspaceResponseDto,
  WorkspaceDetailResponseDto,
  WorkspaceListItemResponseDto,
} from '../dtos/response';

export class WorkspaceMapper {
  static toCreateResponseDto(workspace: Workspace): CreateWorkspaceResponseDto {
    return {
      id: workspace.getId(),
      name: workspace.getName().getValue(),
      slug: workspace.getSlug(),
      description: workspace.getDescription(),
      ownerId: workspace.getOwnerId(),
      status: workspace.getStatus(),
      createdAt: workspace.getCreatedAt(),
    };
  }

  static toDetailDto(workspace: Workspace, memberRole: WorkspaceRole): WorkspaceDetailResponseDto {
    return {
      id: workspace.getId(),
      name: workspace.getName().getValue(),
      slug: workspace.getSlug(),
      description: workspace.getDescription(),
      ownerId: workspace.getOwnerId(),
      status: workspace.getStatus(),
      memberRole: memberRole.getValue(),
      createdAt: workspace.getCreatedAt(),
      updatedAt: workspace.getUpdatedAt(),
    };
  }

  static toListItemDto(
    workspace: Workspace,
    memberRole: WorkspaceRole
  ): WorkspaceListItemResponseDto {
    return {
      id: workspace.getId(),
      name: workspace.getName().getValue(),
      slug: workspace.getSlug(),
      description: workspace.getDescription(),
      memberRole: memberRole.getValue(),
      createdAt: workspace.getCreatedAt(),
    };
  }
}
