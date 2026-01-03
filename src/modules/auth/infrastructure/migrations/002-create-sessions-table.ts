// src/modules/auth/infrastructure/migrations/002-create-sessions-table.ts

import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('sessions', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
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
    refresh_token: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    is_revoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
  await queryInterface.addIndex('sessions', ['user_id'], {
    name: 'sessions_user_id_idx',
  });

  await queryInterface.addIndex('sessions', ['refresh_token'], {
    name: 'sessions_refresh_token_idx',
    unique: true,
  });

  await queryInterface.addIndex('sessions', ['is_revoked'], {
    name: 'sessions_is_revoked_idx',
  });

  await queryInterface.addIndex('sessions', ['expires_at'], {
    name: 'sessions_expires_at_idx',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('sessions');
}
