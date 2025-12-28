// src/modules/auth/infrastructure/persistence/models/RefreshTokenModel.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../../../shared/config/database.config';

interface RefreshTokenAttributes {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RefreshTokenCreationAttributes extends Optional<
  RefreshTokenAttributes,
  'id' | 'createdAt' | 'updatedAt'
> {}

export class RefreshTokenModel
  extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>
  implements RefreshTokenAttributes
{
  public id!: string;
  public userId!: string;
  public token!: string;
  public expiresAt!: Date;
  public isRevoked!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RefreshTokenModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id', // Map to snake_case
      references: {
        model: 'users',
        key: 'id',
      },
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
      field: 'token',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at', // Map to snake_case
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_revoked', // Map to snake_case
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at', // Map to snake_case
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at', // Map to snake_case
    },
  },
  {
    sequelize,
    tableName: 'refresh_tokens',
    timestamps: true,
    underscored: false, // We're handling field mapping manually
    indexes: [
      { fields: ['user_id'] }, // Use snake_case
      { fields: ['token'] },
      { fields: ['expires_at'] }, // Use snake_case
    ],
  }
);
