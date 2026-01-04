// src/modules/workspace/domain/repositories/workspace-member.repository.interface.ts

import { WorkspaceMember } from '../entities/workspace-member.entity';
import { WorkspaceInvitation } from '../entities/workspace-invitation.entity';

export interface IWorkspaceMemberRepository {
  save(member: WorkspaceMember): Promise<WorkspaceMember>;
  findById(id: string): Promise<WorkspaceMember | null>;
  findByWorkspaceAndUser(workspaceId: string, userId: string): Promise<WorkspaceMember | null>;
  findByWorkspaceId(workspaceId: string): Promise<WorkspaceMember[]>;
  findByUserId(userId: string): Promise<WorkspaceMember[]>;
  existsByWorkspaceAndUser(workspaceId: string, userId: string): Promise<boolean>;
  update(member: WorkspaceMember): Promise<WorkspaceMember>;
  delete(id: string): Promise<void>;
  deleteByWorkspaceAndUser(workspaceId: string, userId: string): Promise<void>;
  countByWorkspaceId(workspaceId: string): Promise<number>;
  countOwnersByWorkspaceId(workspaceId: string): Promise<number>;
}

export interface IWorkspaceInvitationRepository {
  save(invitation: WorkspaceInvitation): Promise<WorkspaceInvitation>;
  findById(id: string): Promise<WorkspaceInvitation | null>;
  findByToken(token: string): Promise<WorkspaceInvitation | null>;
  findByWorkspaceId(workspaceId: string): Promise<WorkspaceInvitation[]>;
  findPendingByWorkspaceAndEmail(
    workspaceId: string,
    email: string
  ): Promise<WorkspaceInvitation | null>;
  update(invitation: WorkspaceInvitation): Promise<WorkspaceInvitation>;
  delete(id: string): Promise<void>;
  deleteExpired(): Promise<void>;
}
