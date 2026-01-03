// src/modules/auth/infrastructure/models/session.model.ts

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
} from 'sequelize-typescript';
import { UserModel } from './user.model';

@Table({
  tableName: 'sessions',
  timestamps: true,
  paranoid: false,
  underscored: true,
})
export class SessionModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @ForeignKey(() => UserModel)
  @Index
  @Column(DataType.UUID)
  user_id!: string;

  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  refresh_token!: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  expires_at!: Date;

  @Column(DataType.STRING(45))
  ip_address?: string;

  @Column(DataType.STRING(500))
  user_agent?: string;

  @AllowNull(false)
  @Default(false)
  @Index
  @Column(DataType.BOOLEAN)
  is_revoked!: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  created_at!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updated_at!: Date;
}
