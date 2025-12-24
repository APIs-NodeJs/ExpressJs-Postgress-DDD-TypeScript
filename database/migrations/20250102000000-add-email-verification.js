"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "email_verified", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("users", "verification_token", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn("users", "verification_token_expires", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex("users", ["verification_token"], {
      name: "idx_users_verification_token",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex("users", "idx_users_verification_token");
    await queryInterface.removeColumn("users", "verification_token_expires");
    await queryInterface.removeColumn("users", "verification_token");
    await queryInterface.removeColumn("users", "email_verified");
  },
};
