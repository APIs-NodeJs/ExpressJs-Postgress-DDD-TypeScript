import { sequelize } from "../config/database";
import { Umzug, SequelizeStorage } from "umzug";
import path from "path";

const umzug = new Umzug({
  migrations: {
    glob: path.join(__dirname, "../../database/migrations/*.js"),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

async function runMigrations() {
  try {
    console.log("Running migrations...");
    await sequelize.authenticate();
    const migrations = await umzug.up();
    console.log("✅ Migrations completed:", migrations.length);
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();
