// src/modules/workspace/application/use-cases/add-member.use-case.ts

import { WorkspaceMember } from '../../domain/entities/workspace-member.entity';
import { WorkspaceRole } from '../../domain/value-objects/workspace-role.value-object';
import { IWorkspaceRepository } from '../../domain/repositories/workspace.repository.interface';
import { IWorkspaceMemberRepository } from '../../domain/repositories/workspace-member.repository.interface';
import { IUserRepository } from '@modules/auth/domain/repositories/user.repository.interface';
import { NotFoundError, ForbiddenError, ConflictError } from '@core/errors';
import { MemberAddedEvent } from '../../domain/events/member-added.event';
import { AddMemberRequestDto, WorkspaceMemberResponseDto } from '../dtos';
import { WorkspaceMemberMapper } from '../mappers/workspace-member.mapper';

export class AddMemberUseCase {
  constructor(
    private readonly workspaceRepository: IWorkspaceRepository,
    private readonly memberRepository: IWorkspaceMemberRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(dto: AddMemberRequestDto): Promise<WorkspaceMemberResponseDto> {
    // Check workspace exists
    const workspace = await this.workspaceRepository.findById(dto.workspaceId);
    if (!workspace || workspace.isDeleted()) {
      throw new NotFoundError('Workspace not found');
    }

    // Check requester has permission
    const requesterMember = await this.memberRepository.findByWorkspaceAndUser(
      dto.workspaceId,
      dto.addedBy
    );
    if (!requesterMember || !requesterMember.canManageMembers()) {
      throw new ForbiddenError('You do not have permission to add members');
    }

    // Check user exists
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if already a member
    const existingMember = await this.memberRepository.findByWorkspaceAndUser(
      dto.workspaceId,
      dto.userId
    );
    if (existingMember) {
      throw new ConflictError('User is already a member of this workspace');
    }

    // Create member
    const role = WorkspaceRole.create(dto.role);
    const member = WorkspaceMember.create(dto.workspaceId, dto.userId, role);
    const savedMember = await this.memberRepository.save(member);

    // Emit domain event
    const event = new MemberAddedEvent({
      workspaceId: dto.workspaceId,
      userId: dto.userId,
      role: role.getValue(),
      addedBy: dto.addedBy,
      addedAt: savedMember.getJoinedAt(),
    });

    return WorkspaceMemberMapper.toDto(savedMember, user);
  }
}
