// src/modules/workspace/infrastructure/migrations/004-create-workspace-members-table.ts

import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('workspace_members', {
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
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'member', 'guest'),
      allowNull: false,
      defaultValue: 'member',
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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

  // Add composite unique constraint
  await queryInterface.addConstraint('workspace_members', {
    fields: ['workspace_id', 'user_id'],
    type: 'unique',
    name: 'workspace_members_workspace_user_unique',
  });

  // Add indexes
  await queryInterface.addIndex('workspace_members', ['workspace_id'], {
    name: 'workspace_members_workspace_id_idx',
  });

  await queryInterface.addIndex('workspace_members', ['user_id'], {
    name: 'workspace_members_user_id_idx',
  });

  await queryInterface.addIndex('workspace_members', ['role'], {
    name: 'workspace_members_role_idx',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('workspace_members');
}
