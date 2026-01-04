// src/modules/workspace/application/dtos/request/invite-member.request.dto.ts

export interface InviteMemberRequestDto {
  workspaceId: string;
  email: string;
  role: string;
  invitedBy: string;
}
