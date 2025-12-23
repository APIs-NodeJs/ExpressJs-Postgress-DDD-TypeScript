import { Sequelize } from "sequelize-typescript";
import { config } from "@config/env";
import { UserModel } from "@modules/auth/infrastructure/persistence/models/UserModel";
import { UserRoleModel } from "@modules/auth/infrastructure/persistence/models/UserRoleModel";
import { WorkspaceModel } from "@modules/auth/infrastructure/persistence/models/WorkspaceModel";
import { ProductModel } from "@modules/products/infrastructure/persistence/models/ProductModel";
import { FeatureModel } from "@modules/features/infrastructure/persistence/models/FeatureModel";
import { TaskModel } from "@modules/tasks/infrastructure/persistence/models/TaskModel";
import { TimeLogModel } from "@modules/tasks/infrastructure/persistence/models/TimeLogModel";
import { CommentModel } from "@modules/tasks/infrastructure/persistence/models/CommentModel";
import { BugModel } from "@modules/bugs/infrastructure/persistence/models/BugModel";
import { SprintModel } from "@modules/sprints/infrastructure/persistence/models/SprintModel";
import { ReleaseModel } from "@modules/releases/infrastructure/persistence/models/ReleaseModel";
import { TeamMemberModel } from "@modules/team/infrastructure/persistence/models/TeamMemberModel";
import { UserSettingsModel } from "@modules/settings/infrastructure/persistence/models/UserSettingsModel";
import { ActivityModel } from "@modules/dashboard/infrastructure/persistence/models/ActivityModel";
import { SubscriptionModel } from "@modules/billing/infrastructure/persistence/models/SubscriptionModel";
import { InvoiceModel } from "@modules/billing/infrastructure/persistence/models/InvoiceModel";
import { PaymentMethodModel } from "@modules/billing/infrastructure/persistence/models/PaymentMethodModel";
import { ApprovalWorkflowModel } from "@modules/features/infrastructure/persistence/models/ApprovalWorkflowModel";

export const sequelize = new Sequelize({
  dialect: "postgres",
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.username,
  password: config.database.password,
  logging: config.database.logging ? console.log : false,
  models: [
    UserModel,
    UserRoleModel,
    WorkspaceModel,
    ProductModel,
    FeatureModel,
    TaskModel,
    TimeLogModel,
    CommentModel,
    BugModel,
    SprintModel,
    ReleaseModel,
    TeamMemberModel,
    UserSettingsModel,
    ActivityModel,
    SubscriptionModel,
    InvoiceModel,
    PaymentMethodModel,
    ApprovalWorkflowModel,
  ],
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    if (config.app.env === "development") {
      await sequelize.sync({ alter: true });
      console.log("Database synchronized.");
    }
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
};
