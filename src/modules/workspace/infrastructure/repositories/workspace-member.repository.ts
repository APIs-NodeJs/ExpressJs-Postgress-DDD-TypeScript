// src/modules/workspace/infrastructure/repositories/workspace-member.repository.ts

import {
  IWorkspaceMemberRepository,
  IWorkspaceInvitationRepository,
} from '../../domain/repositories/workspace-member.repository.interface';
import { WorkspaceMember } from '../../domain/entities/workspace-member.entity';
import {
  WorkspaceInvitation,
  InvitationStatus,
} from '../../domain/entities/workspace-invitation.entity';
import {
  WorkspaceRole,
  WorkspaceRoleEnum,
} from '../../domain/value-objects/workspace-role.value-object';
import { Email } from '@modules/auth/domain/value-objects/email.value-object';
import { WorkspaceMemberModel } from '../models/workspace-member.model';
import { WorkspaceInvitationModel } from '../models/workspace-invitation.model';
import { Op } from 'sequelize';

export class WorkspaceMemberRepository implements IWorkspaceMemberRepository {
  async save(member: WorkspaceMember): Promise<WorkspaceMember> {
    const memberProps = member.toObject();

    const model = await WorkspaceMemberModel.create({
      id: memberProps.id,
      workspace_id: memberProps.workspaceId,
      user_id: memberProps.userId,
      role: memberProps.role.getValue(),
      joined_at: memberProps.joinedAt,
    });

    return this.toDomain(model);
  }

  async findById(id: string): Promise<WorkspaceMember | null> {
    const model = await WorkspaceMemberModel.findByPk(id);
    return model ? this.toDomain(model) : null;
  }

  async findByWorkspaceAndUser(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceMember | null> {
    const model = await WorkspaceMemberModel.findOne({
      where: {
        workspace_id: workspaceId,
        user_id: userId,
      },
    });
    return model ? this.toDomain(model) : null;
  }

  async findByWorkspaceId(workspaceId: string): Promise<WorkspaceMember[]> {
    const models = await WorkspaceMemberModel.findAll({
      where: { workspace_id: workspaceId },
      order: [['joined_at', 'ASC']],
    });

    return models.map((model) => this.toDomain(model));
  }

  async findByUserId(userId: string): Promise<WorkspaceMember[]> {
    const models = await WorkspaceMemberModel.findAll({
      where: { user_id: userId },
      order: [['joined_at', 'DESC']],
    });

    return models.map((model) => this.toDomain(model));
  }

  async existsByWorkspaceAndUser(workspaceId: string, userId: string): Promise<boolean> {
    const count = await WorkspaceMemberModel.count({
      where: {
        workspace_id: workspaceId,
        user_id: userId,
      },
    });
    return count > 0;
  }

  async update(member: WorkspaceMember): Promise<WorkspaceMember> {
    const memberProps = member.toObject();

    await WorkspaceMemberModel.update(
      {
        role: memberProps.role.getValue(),
      },
      {
        where: { id: memberProps.id },
      }
    );

    const updated = await WorkspaceMemberModel.findByPk(memberProps.id);
    if (!updated) {
      throw new Error('Member not found after update');
    }

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await WorkspaceMemberModel.destroy({
      where: { id },
    });
  }

  async deleteByWorkspaceAndUser(workspaceId: string, userId: string): Promise<void> {
    await WorkspaceMemberModel.destroy({
      where: {
        workspace_id: workspaceId,
        user_id: userId,
      },
    });
  }

  async countByWorkspaceId(workspaceId: string): Promise<number> {
    return WorkspaceMemberModel.count({
      where: { workspace_id: workspaceId },
    });
  }

  async countOwnersByWorkspaceId(workspaceId: string): Promise<number> {
    return WorkspaceMemberModel.count({
      where: {
        workspace_id: workspaceId,
        role: WorkspaceRoleEnum.OWNER,
      },
    });
  }

  private toDomain(model: WorkspaceMemberModel): WorkspaceMember {
    return WorkspaceMember.fromPersistence({
      id: model.id,
      workspaceId: model.workspace_id,
      userId: model.user_id,
      role: WorkspaceRole.create(model.role),
      joinedAt: model.joined_at,
      createdAt: model.created_at,
      updatedAt: model.updated_at,
    });
  }
}

export class WorkspaceInvitationRepository implements IWorkspaceInvitationRepository {
  async save(invitation: WorkspaceInvitation): Promise<WorkspaceInvitation> {
    const invitationProps = invitation.toObject();

    const model = await WorkspaceInvitationModel.create({
      id: invitationProps.id,
      workspace_id: invitationProps.workspaceId,
      email: invitationProps.email.getValue(),
      role: invitationProps.role.getValue(),
      invited_by: invitationProps.invitedBy,
      token: invitationProps.token,
      status: invitationProps.status,
      expires_at: invitationProps.expiresAt,
      accepted_at: invitationProps.acceptedAt,
    });

    return this.toDomain(model);
  }

  async findById(id: string): Promise<WorkspaceInvitation | null> {
    const model = await WorkspaceInvitationModel.findByPk(id);
    return model ? this.toDomain(model) : null;
  }

  async findByToken(token: string): Promise<WorkspaceInvitation | null> {
    const model = await WorkspaceInvitationModel.findOne({
      where: { token },
    });
    return model ? this.toDomain(model) : null;
  }

  async findByWorkspaceId(workspaceId: string): Promise<WorkspaceInvitation[]> {
    const models = await WorkspaceInvitationModel.findAll({
      where: { workspace_id: workspaceId },
      order: [['created_at', 'DESC']],
    });

    return models.map((model) => this.toDomain(model));
  }

  async findPendingByWorkspaceAndEmail(
    workspaceId: string,
    email: string
  ): Promise<WorkspaceInvitation | null> {
    const model = await WorkspaceInvitationModel.findOne({
      where: {
        workspace_id: workspaceId,
        email: email.toLowerCase(),
        status: InvitationStatus.PENDING,
      },
    });
    return model ? this.toDomain(model) : null;
  }

  async update(invitation: WorkspaceInvitation): Promise<WorkspaceInvitation> {
    const invitationProps = invitation.toObject();

    await WorkspaceInvitationModel.update(
      {
        status: invitationProps.status,
        accepted_at: invitationProps.acceptedAt,
      },
      {
        where: { id: invitationProps.id },
      }
    );

    const updated = await WorkspaceInvitationModel.findByPk(invitationProps.id);
    if (!updated) {
      throw new Error('Invitation not found after update');
    }

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await WorkspaceInvitationModel.destroy({
      where: { id },
    });
  }

  async deleteExpired(): Promise<void> {
    await WorkspaceInvitationModel.destroy({
      where: {
        expires_at: {
          [Op.lt]: new Date(),
        },
        status: InvitationStatus.PENDING,
      },
    });
  }

  private toDomain(model: WorkspaceInvitationModel): WorkspaceInvitation {
    return WorkspaceInvitation.fromPersistence({
      id: model.id,
      workspaceId: model.workspace_id,
      email: Email.create(model.email),
      role: WorkspaceRole.create(model.role),
      invitedBy: model.invited_by,
      token: model.token,
      status: model.status as InvitationStatus,
      expiresAt: model.expires_at,
      acceptedAt: model.accepted_at,
      createdAt: model.created_at,
      updatedAt: model.updated_at,
    });
  }
}
