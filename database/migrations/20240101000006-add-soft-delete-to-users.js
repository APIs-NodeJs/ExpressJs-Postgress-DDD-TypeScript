// database/migrations/20240101000006-add-soft-delete-to-users.js

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "deleted_at", {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn("users", "deleted_by", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Add index for soft delete queries
    await queryInterface.addIndex("users", ["deleted_at"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "deleted_by");
    await queryInterface.removeColumn("users", "deleted_at");
  },
};
