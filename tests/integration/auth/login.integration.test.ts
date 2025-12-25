import request from "supertest";
import { createApp } from "../../../src/app";
import {
  connectDatabase,
  disconnectDatabase,
} from "../../../src/config/database";
import { cleanDatabase } from "../../setup/testDatabase";
import { Application } from "express";
import { UserRepository } from "../../../src/modules/auth/infrastructure/repositories/UserRepository";
import { WorkspaceRepository } from "../../../src/modules/auth/infrastructure/repositories/WorkspaceRepository";
import { PasswordHasher } from "../../../src/modules/auth/infrastructure/security/PasswordHasher";
import { User } from "../../../src/modules/auth/domain/entities/User";
import { Workspace } from "../../../src/modules/auth/domain/entities/Workspace";

describe("POST /api/v1/auth/login - Integration", () => {
  let app: Application;
  let userRepo: UserRepository;
  let workspaceRepo: WorkspaceRepository;
  let passwordHasher: PasswordHasher;

  beforeAll(async () => {
    await connectDatabase();
    app = createApp();
    userRepo = new UserRepository();
    workspaceRepo = new WorkspaceRepository();
    passwordHasher = new PasswordHasher();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  const createTestUser = async (email: string, password: string) => {
    const workspace = Workspace.create({
      name: "Test Workspace",
      ownerId: "temp",
    });
    const createdWorkspace = await workspaceRepo.create(workspace);

    const hashedPassword = await passwordHasher.hash(password);
    const user = User.create({
      email,
      password: hashedPassword,
      name: "Test User",
      role: "user",
      workspaceId: createdWorkspace.id,
    });

    return await userRepo.create(user);
  };

  describe("successful login", () => {
    it("should login with valid credentials", async () => {
      await createTestUser("test@example.com", "Test123!@#");

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "Test123!@#",
        })
        .expect(200);

      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("tokens");
      expect(response.body.data).toHaveProperty("session");
      expect(response.body.data.user.email).toBe("test@example.com");
      expect(response.body.data.user).not.toHaveProperty("password");
    });

    it("should be case-insensitive for email", async () => {
      await createTestUser("test@example.com", "Test123!@#");

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "TEST@EXAMPLE.COM",
          password: "Test123!@#",
        })
        .expect(200);

      expect(response.body.data.user.email).toBe("test@example.com");
    });
  });

  describe("failed login", () => {
    it("should return 401 for non-existent user", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "Test123!@#",
        })
        .expect(401);

      expect(response.body.error.code).toBe("UNAUTHORIZED");
      expect(response.body.error.message).toBe("Invalid credentials");
    });

    it("should return 401 for wrong password", async () => {
      await createTestUser("test@example.com", "Test123!@#");

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "WrongPassword123!",
        })
        .expect(401);

      expect(response.body.error.message).toBe("Invalid credentials");
    });

    it("should return 400 for missing email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          password: "Test123!@#",
        })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("rate limiting", () => {
    it("should enforce rate limit after multiple attempts", async () => {
      await createTestUser("test@example.com", "Test123!@#");

      // Make multiple failed attempts
      for (let i = 0; i < 6; i++) {
        await request(app).post("/api/v1/auth/login").send({
          email: "test@example.com",
          password: "WrongPassword123!",
        });
      }

      // Next attempt should be rate limited
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "Test123!@#",
        })
        .expect(429);

      expect(response.body.error.code).toBe("AUTH_RATE_LIMIT_EXCEEDED");
    });
  });
});
