"use strict";

/**
 * Add performance indexes for commonly queried fields
 * These indexes will significantly improve query performance
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Composite index for workspace + role queries
    // Used when filtering users by workspace and role
    await queryInterface.addIndex("users", ["workspace_id", "role"], {
      name: "idx_users_workspace_role",
      comment: "Optimize queries filtering by workspace and role",
    });

    // Partial index for active reset tokens
    // Only indexes non-null reset tokens to save space
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_users_reset_token_active 
      ON users (reset_token) 
      WHERE reset_token IS NOT NULL
    `);

    // Partial index for active verification tokens
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_users_verification_token_active 
      ON users (verification_token) 
      WHERE verification_token IS NOT NULL
    `);

    // Index for email verification status
    // Useful for finding unverified users
    await queryInterface.addIndex("users", ["email_verified"], {
      name: "idx_users_email_verified",
      comment: "Optimize queries for email verification status",
    });

    // Index for 2FA enabled users
    await queryInterface.addIndex("users", ["two_factor_enabled"], {
      name: "idx_users_two_factor_enabled",
      where: { two_factor_enabled: true },
      comment: "Optimize queries for 2FA enabled users",
    });

    // Composite index for workspace owner lookups
    await queryInterface.addIndex("workspaces", ["owner_id", "created_at"], {
      name: "idx_workspaces_owner_created",
      comment: "Optimize queries for workspace ownership and sorting",
    });

    // Index for audit log queries by user and date range
    await queryInterface.addIndex("audit_logs", ["user_id", "created_at"], {
      name: "idx_audit_logs_user_date",
      comment: "Optimize audit log queries by user and date",
    });

    // Index for audit log queries by workspace and action
    await queryInterface.addIndex(
      "audit_logs",
      ["workspace_id", "action", "created_at"],
      {
        name: "idx_audit_logs_workspace_action",
        comment: "Optimize audit log queries by workspace and action type",
      }
    );

    // Add updated_at indexes for efficient "recent changes" queries
    await queryInterface.addIndex("users", ["updated_at"], {
      name: "idx_users_updated_at",
      comment: "Optimize queries for recently updated users",
    });

    await queryInterface.addIndex("workspaces", ["updated_at"], {
      name: "idx_workspaces_updated_at",
      comment: "Optimize queries for recently updated workspaces",
    });

    console.log("✅ Performance indexes added successfully");
  },

  down: async (queryInterface, Sequelize) => {
    // Remove all indexes in reverse order
    await queryInterface.removeIndex("workspaces", "idx_workspaces_updated_at");
    await queryInterface.removeIndex("users", "idx_users_updated_at");
    await queryInterface.removeIndex(
      "audit_logs",
      "idx_audit_logs_workspace_action"
    );
    await queryInterface.removeIndex("audit_logs", "idx_audit_logs_user_date");
    await queryInterface.removeIndex(
      "workspaces",
      "idx_workspaces_owner_created"
    );
    await queryInterface.removeIndex("users", "idx_users_two_factor_enabled");
    await queryInterface.removeIndex("users", "idx_users_email_verified");

    await queryInterface.sequelize.query(
      "DROP INDEX IF EXISTS idx_users_verification_token_active"
    );
    await queryInterface.sequelize.query(
      "DROP INDEX IF EXISTS idx_users_reset_token_active"
    );

    await queryInterface.removeIndex("users", "idx_users_workspace_role");

    console.log("✅ Performance indexes removed successfully");
  },
};
