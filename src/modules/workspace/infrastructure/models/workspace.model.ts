// src/modules/workspace/infrastructure/models/workspace.model.ts

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
  DeletedAt,
  Index,
} from 'sequelize-typescript';
import { UserModel } from '@modules/auth/infrastructure/models/user.model';

@Table({
  tableName: 'workspaces',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class WorkspaceModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  name!: string;

  @Unique
  @AllowNull(false)
  @Index
  @Column(DataType.STRING(100))
  slug!: string;

  @Column(DataType.TEXT)
  description?: string;

  @AllowNull(false)
  @ForeignKey(() => UserModel)
  @Index
  @Column(DataType.UUID)
  owner_id!: string;

  @AllowNull(false)
  @Default('active')
  @Index
  @Column(DataType.ENUM('active', 'suspended', 'archived'))
  status!: string;

  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at!: Date;

  @DeletedAt
  @Column(DataType.DATE)
  deleted_at?: Date;
}
