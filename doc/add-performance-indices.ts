
export default {
  up: async (queryInterface: any) => {
    // Add composite indices for common queries
    await queryInterface.addIndex('users', ['workspace_id', 'email'], {
      name: 'idx_users_workspace_email',
    });

    await queryInterface.addIndex('user_roles', ['user_id', 'role'], {
      name: 'idx_user_roles_user_role',
    });

    await queryInterface.addIndex('user_settings', ['user_id'], {
      name: 'idx_user_settings_user',
      unique: true,
    });

    // Add partial indices for common filters
    await queryInterface.addIndex('users', ['email_verified'], {
      name: 'idx_users_verified',
      where: { email_verified: true },
    });

    // Add covering indices for list queries
    await queryInterface.addIndex('users', 
      ['workspace_id', 'created_at', 'id', 'email', 'name'], {
      name: 'idx_users_workspace_list',
    });
  },

  down: async (queryInterface: any) => {
    await queryInterface.removeIndex('users', 'idx_users_workspace_email');
    await queryInterface.removeIndex('user_roles', 'idx_user_roles_user_role');
    await queryInterface.removeIndex('user_settings', 'idx_user_settings_user');
    await queryInterface.removeIndex('users', 'idx_users_verified');
    await queryInterface.removeIndex('users', 'idx_users_workspace_list');
  },
};