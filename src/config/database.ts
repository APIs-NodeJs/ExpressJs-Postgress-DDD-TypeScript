import { Sequelize } from "sequelize-typescript";
import { config } from "./env";

export default {
  development: {
    username: config.database.username,
    password: config.database.password,
    database: config.database.name,
    host: config.database.host,
    port: config.database.port,
    dialect: "postgres" as const,
  },
  test: {
    username: config.database.username,
    password: config.database.password,
    database: `${config.database.name}_test`,
    host: config.database.host,
    port: config.database.port,
    dialect: "postgres" as const,
  },
  production: {
    username: config.database.username,
    password: config.database.password,
    database: config.database.name,
    host: config.database.host,
    port: config.database.port,
    dialect: "postgres" as const,
    logging: false,
  },
};
