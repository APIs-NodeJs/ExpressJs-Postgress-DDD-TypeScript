// src/modules/workspace/application/use-cases/create-workspace.use-case.ts

import { Workspace } from '../../domain/entities/workspace.entity';
import { WorkspaceMember } from '../../domain/entities/workspace-member.entity';
import { WorkspaceName } from '../../domain/value-objects/workspace-name.value-object';
import {
  WorkspaceRole,
  WorkspaceRoleEnum,
} from '../../domain/value-objects/workspace-role.value-object';
import { IWorkspaceRepository } from '../../domain/repositories/workspace.repository.interface';
import { IWorkspaceMemberRepository } from '../../domain/repositories/workspace-member.repository.interface';
import { ConflictError } from '@core/errors';
import { WorkspaceCreatedEvent } from '../../domain/events/workspace-created.event';
import { MemberAddedEvent } from '../../domain/events/member-added.event';
import { CreateWorkspaceRequestDto, CreateWorkspaceResponseDto } from '../dtos';
import { WorkspaceMapper } from '../mappers/workspace.mapper';

export class CreateWorkspaceUseCase {
  constructor(
    private readonly workspaceRepository: IWorkspaceRepository,
    private readonly memberRepository: IWorkspaceMemberRepository
  ) {}

  async execute(dto: CreateWorkspaceRequestDto): Promise<CreateWorkspaceResponseDto> {
    const workspaceName = WorkspaceName.create(dto.name);
    const slug = await this.generateUniqueSlug(workspaceName.toSlug());

    // Check if slug already exists
    const existingWorkspace = await this.workspaceRepository.findBySlug(slug);
    if (existingWorkspace) {
      throw new ConflictError('Workspace with this name already exists');
    }

    // Create workspace
    const workspace = Workspace.create({
      name: workspaceName,
      slug,
      description: dto.description,
      ownerId: dto.ownerId,
    });

    const savedWorkspace = await this.workspaceRepository.save(workspace);

    // Add owner as member
    const ownerMember = WorkspaceMember.create(
      savedWorkspace.getId(),
      dto.ownerId,
      WorkspaceRole.owner()
    );
    await this.memberRepository.save(ownerMember);

    // Emit domain events
    const workspaceCreatedEvent = new WorkspaceCreatedEvent({
      workspaceId: savedWorkspace.getId(),
      workspaceName: savedWorkspace.getName().getValue(),
      workspaceSlug: savedWorkspace.getSlug(),
      ownerId: dto.ownerId,
      createdAt: savedWorkspace.getCreatedAt(),
    });

    const memberAddedEvent = new MemberAddedEvent({
      workspaceId: savedWorkspace.getId(),
      userId: dto.ownerId,
      role: WorkspaceRoleEnum.OWNER,
      addedBy: dto.ownerId,
      addedAt: ownerMember.getJoinedAt(),
    });

    return WorkspaceMapper.toCreateResponseDto(savedWorkspace);
  }

  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await this.workspaceRepository.existsBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
