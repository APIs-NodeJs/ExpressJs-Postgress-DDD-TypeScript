// src/modules/workspace/application/use-cases/accept-invitation.use-case.ts

import { WorkspaceMember } from '../../domain/entities/workspace-member.entity';
import { IWorkspaceRepository } from '../../domain/repositories/workspace.repository.interface';
import {
  IWorkspaceMemberRepository,
  IWorkspaceInvitationRepository,
} from '../../domain/repositories/workspace-member.repository.interface';
import { IUserRepository } from '@modules/auth/domain/repositories/user.repository.interface';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '@core/errors';
import { InvitationAcceptedEvent } from '../../domain/events/invitation-accepted.event';
import { MemberAddedEvent } from '../../domain/events/member-added.event';
import { AcceptInvitationRequestDto, WorkspaceMemberResponseDto } from '../dtos';
import { WorkspaceMemberMapper } from '../mappers/workspace-member.mapper';

export class AcceptInvitationUseCase {
  constructor(
    private readonly invitationRepository: IWorkspaceInvitationRepository,
    private readonly workspaceRepository: IWorkspaceRepository,
    private readonly memberRepository: IWorkspaceMemberRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(dto: AcceptInvitationRequestDto): Promise<WorkspaceMemberResponseDto> {
    // Find invitation by token
    const invitation = await this.invitationRepository.findByToken(dto.token);

    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    if (!invitation.canBeAccepted()) {
      if (invitation.isExpired()) {
        throw new ValidationError('Invitation has expired');
      }
      throw new ValidationError('Invitation is no longer valid');
    }

    // Get user
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify email matches
    if (user.getEmail().getValue() !== invitation.getEmail().getValue()) {
      throw new ForbiddenError('This invitation is for a different email address');
    }

    // Check workspace still exists
    const workspace = await this.workspaceRepository.findById(invitation.getWorkspaceId());
    if (!workspace || workspace.isDeleted()) {
      throw new NotFoundError('Workspace no longer exists');
    }

    // Check if already a member
    const existingMember = await this.memberRepository.findByWorkspaceAndUser(
      invitation.getWorkspaceId(),
      dto.userId
    );
    if (existingMember) {
      throw new ConflictError('You are already a member of this workspace');
    }

    // Accept invitation
    invitation.accept();
    await this.invitationRepository.update(invitation);

    // Create member
    const member = WorkspaceMember.create(
      invitation.getWorkspaceId(),
      dto.userId,
      invitation.getRole()
    );
    const savedMember = await this.memberRepository.save(member);

    // Emit domain events
    const invitationAcceptedEvent = new InvitationAcceptedEvent({
      workspaceId: invitation.getWorkspaceId(),
      userId: dto.userId,
      email: user.getEmail().getValue(),
      role: invitation.getRole().getValue(),
      acceptedAt: invitation.getAcceptedAt()!,
    });

    const memberAddedEvent = new MemberAddedEvent({
      workspaceId: invitation.getWorkspaceId(),
      userId: dto.userId,
      role: invitation.getRole().getValue(),
      addedBy: invitation.getInvitedBy(),
      addedAt: savedMember.getJoinedAt(),
    });

    return WorkspaceMemberMapper.toDto(savedMember, user);
  }
}
