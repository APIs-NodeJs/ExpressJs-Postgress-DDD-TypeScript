"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "reset_token", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn("users", "reset_token_expires", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex("users", ["reset_token"], {
      name: "idx_users_reset_token",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex("users", "idx_users_reset_token");
    await queryInterface.removeColumn("users", "reset_token_expires");
    await queryInterface.removeColumn("users", "reset_token");
  },
};
