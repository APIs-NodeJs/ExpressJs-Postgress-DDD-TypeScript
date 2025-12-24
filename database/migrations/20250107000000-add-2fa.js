"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "two_factor_enabled", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("users", "two_factor_secret", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn("users", "backup_codes", {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("users", "backup_codes");
    await queryInterface.removeColumn("users", "two_factor_secret");
    await queryInterface.removeColumn("users", "two_factor_enabled");
  },
};
