"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add foreign key constraint from workspaces.owner_id to users.id
    // This must run AFTER both workspaces and users tables are created
    await queryInterface.addConstraint("workspaces", {
      fields: ["owner_id"],
      type: "foreign key",
      name: "fk_workspaces_owner",
      references: {
        table: "users",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT", // Prevent deleting user who owns a workspace
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("workspaces", "fk_workspaces_owner");
  },
};
