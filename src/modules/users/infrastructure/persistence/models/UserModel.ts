// src/modules/users/infrastructure/persistence/models/UserModel.ts
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../../../../../shared/config/database.config';

interface UserAttributes {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash?: string;
  googleId?: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UserCreationAttributes extends Optional<
  UserAttributes,
  'id' | 'createdAt' | 'updatedAt'
> {}

export class UserModel
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public email!: string;
  public firstName!: string;
  public lastName!: string;
  public passwordHash?: string;
  public googleId?: string;
  public role!: string;
  public isActive!: boolean;
  public emailVerified!: boolean;
  public lastLoginAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      field: 'email', // Explicitly set field name
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name', // Map to snake_case
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name', // Map to snake_case
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'password_hash', // Map to snake_case
    },
    googleId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: 'google_id', // Map to snake_case
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'USER',
      field: 'role',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active', // Map to snake_case
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'email_verified', // Map to snake_case
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at', // Map to snake_case
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
    tableName: 'users',
    timestamps: true,
    underscored: false, // We're handling field mapping manually
    indexes: [
      { fields: ['email'] },
      { fields: ['google_id'] }, // Use snake_case in index definition
    ],
  }
);
