// src/modules/workspace/application/mappers/workspace-member.mapper.ts

import { WorkspaceMember } from '../../domain/entities/workspace-member.entity';
import { WorkspaceInvitation } from '../../domain/entities/workspace-invitation.entity';
import { Workspace } from '../../domain/entities/workspace.entity';
import { User } from '@modules/auth/domain/entities/user.entity';
import { WorkspaceMemberResponseDto, WorkspaceInvitationResponseDto } from '../dtos/response';

export class WorkspaceMemberMapper {
  static toDto(member: WorkspaceMember, user: User): WorkspaceMemberResponseDto {
    return {
      id: member.getId(),
      workspaceId: member.getWorkspaceId(),
      userId: member.getUserId(),
      userEmail: user.getEmail().getValue(),
      userFullName: user.getFullName(),
      role: member.getRole().getValue(),
      joinedAt: member.getJoinedAt(),
    };
  }

  static toDtoList(
    members: Array<{ member: WorkspaceMember; user: User }>
  ): WorkspaceMemberResponseDto[] {
    return members.map(({ member, user }) => this.toDto(member, user));
  }
}

export class WorkspaceInvitationMapper {
  static toDto(
    invitation: WorkspaceInvitation,
    workspace: Workspace
  ): WorkspaceInvitationResponseDto {
    return {
      id: invitation.getId(),
      workspaceId: invitation.getWorkspaceId(),
      workspaceName: workspace.getName().getValue(),
      email: invitation.getEmail().getValue(),
      role: invitation.getRole().getValue(),
      status: invitation.getStatus(),
      expiresAt: invitation.getExpiresAt(),
      createdAt: invitation.getCreatedAt(),
    };
  }

  static toDtoList(
    invitations: Array<{ invitation: WorkspaceInvitation; workspace: Workspace }>
  ): WorkspaceInvitationResponseDto[] {
    return invitations.map(({ invitation, workspace }) => this.toDto(invitation, workspace));
  }
}
