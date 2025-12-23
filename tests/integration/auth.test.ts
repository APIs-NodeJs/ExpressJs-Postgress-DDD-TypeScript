import request from "supertest";

import { createApp } from "../../src/app";
import {
  initializeDatabase,
  sequelize,
} from "../../src/infrastructure/database/sequelize";

describe("Auth Integration Tests", () => {
  const app = createApp();
  let testUserId: string;
  let testAccessToken: string;

  beforeAll(async () => {
    // Initialize test database
    await initializeDatabase();
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  describe("POST /api/v1/auth/signup", () => {
    it("should create a new user successfully", async () => {
      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          email: "test@example.com",
          password: "Test123!@#",
          name: "Test User",
          workspaceName: "Test Workspace",
        })
        .expect(201);

      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("tokens");
      expect(response.body.data.user.email).toBe("test@example.com");
      expect(response.body.data.tokens).toHaveProperty("accessToken");
      expect(response.body.data.tokens).toHaveProperty("refreshToken");

      // Store for later tests
      testUserId = response.body.data.user.id;
      testAccessToken = response.body.data.tokens.accessToken;
    });

    it("should fail with invalid email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          email: "invalid-email",
          password: "Test123!@#",
          name: "Test User",
        })
        .expect(400);

      expect(response.body.error).toHaveProperty("code");
      expect(response.body.error.code).toBe("BAD_REQUEST");
    });

    it("should fail with weak password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          email: "test2@example.com",
          password: "weak",
          name: "Test User",
        })
        .expect(400);

      expect(response.body.error).toHaveProperty("code");
      expect(response.body.error.code).toBe("BAD_REQUEST");
    });

    it("should fail with duplicate email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          email: "test@example.com",
          password: "Test123!@#",
          name: "Test User 2",
        })
        .expect(400);

      expect(response.body.error.message).toContain("already exists");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should login successfully with correct credentials", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "Test123!@#",
        })
        .expect(200);

      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("tokens");
      expect(response.body.data.user.email).toBe("test@example.com");
    });

    it("should fail with incorrect password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "WrongPassword123",
        })
        .expect(401);

      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should fail with non-existent email", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "Test123!@#",
        })
        .expect(401);

      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("should get current user with valid token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${testAccessToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.email).toBe("test@example.com");
      expect(response.body.data).toHaveProperty("role");
      expect(response.body.data).toHaveProperty("permissions");
    });

    it("should fail without token", async () => {
      const response = await request(app).get("/api/v1/auth/me").expect(401);

      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });

    it("should fail with invalid token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("PATCH /api/v1/auth/me", () => {
    it("should update user profile", async () => {
      const response = await request(app)
        .patch("/api/v1/auth/me")
        .set("Authorization", `Bearer ${testAccessToken}`)
        .send({
          name: "Updated Test User",
        })
        .expect(200);

      expect(response.body.data.name).toBe("Updated Test User");
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    let refreshToken: string;

    beforeAll(async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: "Test123!@#",
      });

      refreshToken = response.body.data.tokens.refreshToken;
    });

    it("should refresh access token with valid refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({
          refreshToken,
        })
        .expect(200);

      expect(response.body.data).toHaveProperty("accessToken");
      expect(response.body.data).toHaveProperty("refreshToken");
    });

    it("should fail with invalid refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .send({
          refreshToken: "invalid-token",
        })
        .expect(401);

      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });
  });
});
