import request from "supertest";
import { createApp } from "../../src/app";
import { connectDatabase, disconnectDatabase } from "../../src/config/database";
import { cleanDatabase } from "../setup/testDatabase";
import { Application } from "express";

describe("Complete Authentication Flow - E2E", () => {
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

  it("should complete full user journey: signup -> login -> access protected route -> logout", async () => {
    // 1. Sign up
    const signupResponse = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        email: "user@example.com",
        password: "Test123!@#",
        name: "Test User",
        workspaceName: "Test Workspace",
      })
      .expect(201);

    expect(signupResponse.body.data.user.email).toBe("user@example.com");
    const accessToken = signupResponse.body.data.tokens.accessToken;
    const refreshToken = signupResponse.body.data.tokens.refreshToken;

    // 2. Access protected route with token
    const meResponse = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(meResponse.body.data.email).toBe("user@example.com");

    // 3. Refresh token
    const refreshResponse = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken })
      .expect(200);

    const newAccessToken = refreshResponse.body.data.accessToken;
    expect(newAccessToken).toBeDefined();
    expect(newAccessToken).not.toBe(accessToken);

    // 4. Use new access token
    await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${newAccessToken}`)
      .expect(200);

    // 5. Logout
    await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${newAccessToken}`)
      .expect(204);

    // 6. Try to use old refresh token (should fail due to rotation)
    await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken })
      .expect(401);
  });

  it("should handle concurrent login sessions", async () => {
    // Sign up
    await request(app).post("/api/v1/auth/signup").send({
      email: "user@example.com",
      password: "Test123!@#",
      name: "Test User",
      workspaceName: "Test Workspace",
    });

    // Login from device 1
    const login1 = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "user@example.com",
        password: "Test123!@#",
      })
      .expect(200);

    // Login from device 2
    const login2 = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "user@example.com",
        password: "Test123!@#",
      })
      .expect(200);

    // Both tokens should work
    await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${login1.body.data.tokens.accessToken}`)
      .expect(200);

    await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${login2.body.data.tokens.accessToken}`)
      .expect(200);
  });
});
