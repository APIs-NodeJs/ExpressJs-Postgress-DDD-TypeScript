"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("audit_logs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      workspace_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      resource_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      resource_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("audit_logs", ["user_id"]);
    await queryInterface.addIndex("audit_logs", ["workspace_id"]);
    await queryInterface.addIndex("audit_logs", ["action"]);
    await queryInterface.addIndex("audit_logs", ["created_at"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("audit_logs");
  },
};
