// src/modules/workspace/application/dtos/response/workspace-member.response.dto.ts

export interface WorkspaceMemberResponseDto {
  id: string;
  workspaceId: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  role: string;
  joinedAt: Date;
}

export interface WorkspaceInvitationResponseDto {
  id: string;
  workspaceId: string;
  workspaceName: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}
