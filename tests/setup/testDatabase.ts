import { Sequelize } from "sequelize";
import { UserModel } from "../../src/infrastructure/database/models/UserModel";
import { WorkspaceModel } from "../../src/infrastructure/database/models/WorkspaceModel";

export async function setupTestDatabase(): Promise<Sequelize> {
  const sequelize = new Sequelize({
    dialect: "postgres",
    host: process.env.TEST_DB_HOST || "localhost",
    port: Number(process.env.TEST_DB_PORT) || 5433,
    database: process.env.TEST_DB_NAME || "devcycle_test",
    username: process.env.TEST_DB_USER || "postgres",
    password: process.env.TEST_DB_PASSWORD || "postgres",
    logging: false,
  });

  await sequelize.sync({ force: true });
  return sequelize;
}

export async function cleanDatabase(): Promise<void> {
  await UserModel.destroy({ where: {}, truncate: true, cascade: true });
  await WorkspaceModel.destroy({ where: {}, truncate: true, cascade: true });
}
