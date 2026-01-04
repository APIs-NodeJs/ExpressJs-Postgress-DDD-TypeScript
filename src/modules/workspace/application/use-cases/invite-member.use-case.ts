// src/modules/workspace/application/use-cases/invite-member.use-case.ts

import { WorkspaceInvitation } from '../../domain/entities/workspace-invitation.entity';
import { Email } from '@modules/auth/domain/value-objects/email.value-object';
import { WorkspaceRole } from '../../domain/value-objects/workspace-role.value-object';
import { IWorkspaceRepository } from '../../domain/repositories/workspace.repository.interface';
import {
  IWorkspaceMemberRepository,
  IWorkspaceInvitationRepository,
} from '../../domain/repositories/workspace-member.repository.interface';
import { NotFoundError, ForbiddenError, ConflictError } from '@core/errors';
import { DateUtil } from '@core/utils';
import { InvitationSentEvent } from '../../domain/events/invitation-sent.event';
import { InviteMemberRequestDto, WorkspaceInvitationResponseDto } from '../dtos';
import { WorkspaceInvitationMapper } from '../mappers/workspace-member.mapper';

export class InviteMemberUseCase {
  constructor(
    private readonly workspaceRepository: IWorkspaceRepository,
    private readonly memberRepository: IWorkspaceMemberRepository,
    private readonly invitationRepository: IWorkspaceInvitationRepository
  ) {}

  async execute(dto: InviteMemberRequestDto): Promise<WorkspaceInvitationResponseDto> {
    // Check workspace exists
    const workspace = await this.workspaceRepository.findById(dto.workspaceId);
    if (!workspace || workspace.isDeleted()) {
      throw new NotFoundError('Workspace not found');
    }

    // Check requester has permission
    const requesterMember = await this.memberRepository.findByWorkspaceAndUser(
      dto.workspaceId,
      dto.invitedBy
    );
    if (!requesterMember || !requesterMember.canInviteMembers()) {
      throw new ForbiddenError('You do not have permission to invite members');
    }

    const email = Email.create(dto.email);

    // Check if email is already a member (by checking existing users with this email)
    // This would require user lookup by email - simplified here

    // Check for existing pending invitation
    const existingInvitation = await this.invitationRepository.findPendingByWorkspaceAndEmail(
      dto.workspaceId,
      email.getValue()
    );
    if (existingInvitation) {
      throw new ConflictError('An invitation for this email already exists');
    }

    // Create invitation (expires in 7 days)
    const expiresAt = DateUtil.addDays(new Date(), 7);
    const role = WorkspaceRole.create(dto.role);

    const invitation = WorkspaceInvitation.create(
      dto.workspaceId,
      email,
      role,
      dto.invitedBy,
      expiresAt
    );

    const savedInvitation = await this.invitationRepository.save(invitation);

    // Emit domain event (would trigger email sending)
    const event = new InvitationSentEvent({
      workspaceId: dto.workspaceId,
      email: email.getValue(),
      role: role.getValue(),
      invitedBy: dto.invitedBy,
      token: savedInvitation.getToken(),
      expiresAt,
      sentAt: savedInvitation.getCreatedAt(),
    });

    return WorkspaceInvitationMapper.toDto(savedInvitation, workspace);
  }
}
