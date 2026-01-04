// src/modules/workspace/infrastructure/models/workspace-member.model.ts

import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
  Index,
  Unique,
} from 'sequelize-typescript';
import { UserModel } from '@modules/auth/infrastructure/models/user.model';
import { WorkspaceModel } from './workspace.model';

@Table({
  tableName: 'workspace_members',
  timestamps: true,
  paranoid: false,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['workspace_id', 'user_id'],
    },
  ],
})
export class WorkspaceMemberModel extends Model {
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
  @ForeignKey(() => UserModel)
  @Index
  @Column(DataType.UUID)
  user_id!: string;

  @AllowNull(false)
  @Default('member')
  @Index
  @Column(DataType.ENUM('owner', 'admin', 'member', 'guest'))
  role!: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  joined_at!: Date;

  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at!: Date;
}
