// src/modules/workspace/application/use-cases/get-workspace.use-case.ts

import { IWorkspaceRepository } from '../../domain/repositories/workspace.repository.interface';
import { IWorkspaceMemberRepository } from '../../domain/repositories/workspace-member.repository.interface';
import { NotFoundError, ForbiddenError } from '@core/errors';
import { GetWorkspaceRequestDto, WorkspaceDetailResponseDto } from '../dtos';
import { WorkspaceMapper } from '../mappers/workspace.mapper';

export class GetWorkspaceUseCase {
  constructor(
    private readonly workspaceRepository: IWorkspaceRepository,
    private readonly memberRepository: IWorkspaceMemberRepository
  ) {}

  async execute(dto: GetWorkspaceRequestDto): Promise<WorkspaceDetailResponseDto> {
    const workspace = await this.workspaceRepository.findById(dto.workspaceId);

    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    if (workspace.isDeleted()) {
      throw new NotFoundError('Workspace has been deleted');
    }

    // Check if user is a member
    const member = await this.memberRepository.findByWorkspaceAndUser(dto.workspaceId, dto.userId);

    if (!member) {
      throw new ForbiddenError('You are not a member of this workspace');
    }

    return WorkspaceMapper.toDetailDto(workspace, member.getRole());
  }
}
