// src/modules/workspace/infrastructure/models/workspace-invitation.model.ts

import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
  Index,
} from 'sequelize-typescript';
import { UserModel } from '@modules/auth/infrastructure/models/user.model';
import { WorkspaceModel } from './workspace.model';

@Table({
  tableName: 'workspace_invitations',
  timestamps: true,
  paranoid: false,
  underscored: true,
})
export class WorkspaceInvitationModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @ForeignKey(() => WorkspaceModel)
  @Index
  @Column(DataType.UUID)
  workspace_id!: string;

  @AllowNull(false)
  @Index
  @Column(DataType.STRING(255))
  email!: string;

  @AllowNull(false)
  @Default('member')
  @Column(DataType.ENUM('admin', 'member', 'guest'))
  role!: string;

  @AllowNull(false)
  @ForeignKey(() => UserModel)
  @Column(DataType.UUID)
  invited_by!: string;

  @Unique
  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  token!: string;

  @AllowNull(false)
  @Default('pending')
  @Index
  @Column(DataType.ENUM('pending', 'accepted', 'expired', 'cancelled'))
  status!: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  expires_at!: Date;

  @Column(DataType.DATE)
  accepted_at?: Date;

  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at!: Date;
}
