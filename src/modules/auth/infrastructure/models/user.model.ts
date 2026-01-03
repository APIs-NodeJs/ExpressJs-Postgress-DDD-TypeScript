// src/modules/auth/infrastructure/models/user.model.ts

import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  Index,
} from 'sequelize-typescript';

@Table({
  tableName: 'users',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class UserModel extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Unique
  @AllowNull(false)
  @Index
  @Column(DataType.STRING(255))
  email!: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  password_hash!: string;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  first_name!: string;

  @AllowNull(false)
  @Column(DataType.STRING(100))
  last_name!: string;

  @AllowNull(false)
  @Default('pending_verification')
  @Index
  @Column(DataType.ENUM('active', 'inactive', 'suspended', 'pending_verification'))
  status!: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  email_verified!: boolean;

  @Column(DataType.DATE)
  last_login_at?: Date;

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
  BelongsTo,
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

  @Unique
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

  @BelongsTo(() => UserModel)
  user!: UserModel;
}
