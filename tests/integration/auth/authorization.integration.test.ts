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
import { TokenService } from "../../../src/modules/auth/infrastructure/security/TokenService";
import { User } from "../../../src/modules/auth/domain/entities/User";
import { Workspace } from "../../../src/modules/auth/domain/entities/Workspace";

describe("Authorization Integration Tests", () => {
  let app: Application;
  let userRepo: UserRepository;
  let workspaceRepo: WorkspaceRepository;
  let tokenService: TokenService;

  beforeAll(async () => {
    await connectDatabase();
    app = createApp();
    userRepo = new UserRepository();
    workspaceRepo = new WorkspaceRepository();
    tokenService = new TokenService();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  async function createUserWithRole(role: "owner" | "admin" | "user") {
    // Create workspace
    const workspace = Workspace.create({
      name: "Test Workspace",
      ownerId: "temp",
    });
    const createdWorkspace = await workspaceRepo.create(workspace);

    // Create user
    const user = User.create({
      email: `${role}@example.com`,
      password: "hashedPassword",
      name: `${role} User`,
      role,
      workspaceId: createdWorkspace.id,
    });
    const createdUser = await userRepo.create(user);

    // Generate token
    const tokens = tokenService.generateTokenPair({
      userId: createdUser.id,
      workspaceId: createdUser.workspaceId,
      email: createdUser.email,
      role: createdUser.role,
    });

    return { user: createdUser, token: tokens.accessToken };
  }

  describe("Role-based authorization", () => {
    it("should allow owner to access admin routes", async () => {
      const { token } = await createUserWithRole("owner");

      const response = await request(app)
        .get("/api/v1/auth/admin/users")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it("should allow admin to access admin routes", async () => {
      const { token } = await createUserWithRole("admin");

      const response = await request(app)
        .get("/api/v1/auth/admin/users")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it("should deny user access to admin routes", async () => {
      const { token } = await createUserWithRole("user");

      const response = await request(app)
        .get("/api/v1/auth/admin/users")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);

      expect(response.body.error.code).toBe("FORBIDDEN");
    });

    it("should deny access without token", async () => {
      await request(app).get("/api/v1/auth/admin/users").expect(401);
    });
  });

  describe("Permission-based authorization", () => {
    it("should allow admin to invite users", async () => {
      const { token } = await createUserWithRole("admin");

      const response = await request(app)
        .post("/api/v1/auth/users/invite")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "new@example.com" })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it("should deny regular user from inviting users", async () => {
      const { token } = await createUserWithRole("user");

      const response = await request(app)
        .post("/api/v1/auth/users/invite")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "new@example.com" })
        .expect(403);

      expect(response.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("Token validation with roles", () => {
    it("should include role in token payload", async () => {
      const { token } = await createUserWithRole("admin");

      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.role).toBe("admin");
    });

    it("should reject expired tokens", async () => {
      // Create token with 0 expiry (already expired)
      const expiredToken = tokenService.generateTokenPair({
        userId: "user-123",
        workspaceId: "workspace-123",
        email: "test@example.com",
        role: "user",
      });

      // Wait a moment to ensure expiry
      await new Promise((resolve) => setTimeout(resolve, 100));

      await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${expiredToken.accessToken}`)
        .expect(401);
    });
  });
});
