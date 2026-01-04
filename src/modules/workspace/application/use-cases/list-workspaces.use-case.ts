// src/modules/workspace/application/use-cases/list-workspaces.use-case.ts

import { IWorkspaceMemberRepository } from '../../domain/repositories/workspace-member.repository.interface';
import { IWorkspaceRepository } from '../../domain/repositories/workspace.repository.interface';
import { ListWorkspacesRequestDto, WorkspaceListItemResponseDto } from '../dtos';
import { WorkspaceMapper } from '../mappers/workspace.mapper';

export class ListWorkspacesUseCase {
  constructor(
    private readonly memberRepository: IWorkspaceMemberRepository,
    private readonly workspaceRepository: IWorkspaceRepository
  ) {}

  async execute(dto: ListWorkspacesRequestDto): Promise<WorkspaceListItemResponseDto[]> {
    // Get all memberships for user
    const memberships = await this.memberRepository.findByUserId(dto.userId);

    // Get workspace details for each membership
    const workspaces = await Promise.all(
      memberships.map(async (member) => {
        const workspace = await this.workspaceRepository.findById(member.getWorkspaceId());
        if (!workspace || workspace.isDeleted()) {
          return null;
        }
        return WorkspaceMapper.toListItemDto(workspace, member.getRole());
      })
    );

    return workspaces.filter((w) => w !== null) as WorkspaceListItemResponseDto[];
  }
}
