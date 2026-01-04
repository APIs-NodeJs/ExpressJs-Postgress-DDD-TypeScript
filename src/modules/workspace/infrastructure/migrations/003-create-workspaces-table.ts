// src/modules/workspace/infrastructure/migrations/003-create-workspaces-table.ts

import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('workspaces', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'archived'),
      allowNull: false,
      defaultValue: 'active',
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
  await queryInterface.addIndex('workspaces', ['slug'], {
    name: 'workspaces_slug_idx',
    unique: true,
  });

  await queryInterface.addIndex('workspaces', ['owner_id'], {
    name: 'workspaces_owner_id_idx',
  });

  await queryInterface.addIndex('workspaces', ['status'], {
    name: 'workspaces_status_idx',
  });

  await queryInterface.addIndex('workspaces', ['created_at'], {
    name: 'workspaces_created_at_idx',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('workspaces');
}
