// src/modules/workspace/infrastructure/migrations/005-create-workspace-invitations-table.ts

import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('workspace_invitations', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    workspace_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'workspaces',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'member', 'guest'),
      allowNull: false,
      defaultValue: 'member',
    },
    invited_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    token: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    accepted_at: {
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
  });

  // Add indexes
  await queryInterface.addIndex('workspace_invitations', ['workspace_id'], {
    name: 'workspace_invitations_workspace_id_idx',
  });

  await queryInterface.addIndex('workspace_invitations', ['email'], {
    name: 'workspace_invitations_email_idx',
  });

  await queryInterface.addIndex('workspace_invitations', ['token'], {
    name: 'workspace_invitations_token_idx',
    unique: true,
  });

  await queryInterface.addIndex('workspace_invitations', ['status'], {
    name: 'workspace_invitations_status_idx',
  });

  await queryInterface.addIndex('workspace_invitations', ['expires_at'], {
    name: 'workspace_invitations_expires_at_idx',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('workspace_invitations');
}
