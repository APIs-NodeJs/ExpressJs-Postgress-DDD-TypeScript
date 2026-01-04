// src/modules/workspace/application/use-cases/remove-member.use-case.ts

import { IWorkspaceRepository } from '../../domain/repositories/workspace.repository.interface';
import { IWorkspaceMemberRepository } from '../../domain/repositories/workspace-member.repository.interface';
import { NotFoundError, ForbiddenError, ValidationError } from '@core/errors';
import { MemberRemovedEvent } from '../../domain/events/member-removed.event';
import { RemoveMemberRequestDto } from '../dtos';

export class RemoveMemberUseCase {
  constructor(
    private readonly workspaceRepository: IWorkspaceRepository,
    private readonly memberRepository: IWorkspaceMemberRepository
  ) {}

  async execute(dto: RemoveMemberRequestDto): Promise<void> {
    // Check workspace exists
    const workspace = await this.workspaceRepository.findById(dto.workspaceId);
    if (!workspace || workspace.isDeleted()) {
      throw new NotFoundError('Workspace not found');
    }

    // Check requester has permission
    const requesterMember = await this.memberRepository.findByWorkspaceAndUser(
      dto.workspaceId,
      dto.removedBy
    );
    if (!requesterMember || !requesterMember.canRemoveMembers()) {
      throw new ForbiddenError('You do not have permission to remove members');
    }

    // Check member exists
    const memberToRemove = await this.memberRepository.findByWorkspaceAndUser(
      dto.workspaceId,
      dto.userId
    );
    if (!memberToRemove) {
      throw new NotFoundError('Member not found in this workspace');
    }

    // Cannot remove the owner
    if (memberToRemove.isOwner()) {
      throw new ForbiddenError('Cannot remove workspace owner');
    }

    // Remove member
    await this.memberRepository.delete(memberToRemove.getId());

    // Emit domain event
    const event = new MemberRemovedEvent({
      workspaceId: dto.workspaceId,
      userId: dto.userId,
      removedBy: dto.removedBy,
      removedAt: new Date(),
    });
  }
}
