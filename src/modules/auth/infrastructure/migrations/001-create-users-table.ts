// src/modules/auth/infrastructure/migrations/001-create-users-table.ts

import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('users', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending_verification'),
      allowNull: false,
      defaultValue: 'pending_verification',
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Add indexes
  await queryInterface.addIndex('users', ['email'], {
    name: 'users_email_idx',
    unique: true,
  });

  await queryInterface.addIndex('users', ['status'], {
    name: 'users_status_idx',
  });

  await queryInterface.addIndex('users', ['created_at'], {
    name: 'users_created_at_idx',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('users');
}
