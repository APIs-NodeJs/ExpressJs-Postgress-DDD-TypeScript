import { connectDatabase, disconnectDatabase } from "../../src/config/database";

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});
