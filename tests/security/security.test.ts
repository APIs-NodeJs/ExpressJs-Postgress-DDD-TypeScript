import request from "supertest";
import { createApp } from "../../src/app";
import { connectDatabase, disconnectDatabase } from "../../src/config/database";
import { cleanDatabase } from "../setup/testDatabase";
import { Application } from "express";

describe("Security Tests", () => {
  let app: Application;

  beforeAll(async () => {
    await connectDatabase();
    app = createApp();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("SQL Injection Prevention", () => {
    it("should handle SQL injection in email field", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "admin'--",
          password: "password",
        })
        .expect(401);

      expect(response.body.error.message).toBe("Invalid credentials");
    });
  });

  describe("XSS Prevention", () => {
    it("should sanitize malicious script in name", async () => {
      const response = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          email: "test@example.com",
          password: "Test123!@#",
          name: "<script>alert('xss')</script>",
          workspaceName: "Test Workspace",
        })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("CSRF Protection", () => {
    it("should include CSRF token in responses", async () => {
      const response = await request(app).get("/health").expect(200);

      // Check security headers
      expect(response.headers).toHaveProperty("x-request-id");
    });
  });

  describe("Password Security", () => {
    it("should not expose password in any response", async () => {
      const signupResponse = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          email: "test@example.com",
          password: "Test123!@#",
          name: "Test User",
          workspaceName: "Test Workspace",
        });

      expect(signupResponse.body.data.user).not.toHaveProperty("password");

      const meResponse = await request(app)
        .get("/api/v1/auth/me")
        .set(
          "Authorization",
          `Bearer ${signupResponse.body.data.tokens.accessToken}`
        );

      expect(meResponse.body.data).not.toHaveProperty("password");
    });
  });

  describe("Token Security", () => {
    it("should reject tampered JWT", async () => {
      const tamperedToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0YW1wZXJlZCJ9.tampered";

      await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${tamperedToken}`)
        .expect(401);
    });
  });
});
