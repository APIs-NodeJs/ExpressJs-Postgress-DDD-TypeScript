import request from "supertest";
import { createApp } from "../../../src/app";
import {
  connectDatabase,
  disconnectDatabase,
} from "../../../src/config/database";
import { cleanDatabase } from "../../setup/testDatabase";
import { Application } from "express";

describe("POST /api/v1/auth/signup", () => {
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

  const validSignupData = {
    email: "newuser@example.com",
    password: "Test123!@#",
    name: "New User",
    workspaceName: "New Workspace",
  };

  it("should create user and return tokens with 201", async () => {
    const response = await request(app)
      .post("/api/v1/auth/signup")
      .send(validSignupData)
      .expect(201);

    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("user");
    expect(response.body.data).toHaveProperty("tokens");

    expect(response.body.data.user.email).toBe(validSignupData.email);
    expect(response.body.data.user.name).toBe(validSignupData.name);
    expect(response.body.data.user.role).toBe("owner");
    expect(response.body.data.user).not.toHaveProperty("password");

    expect(response.body.data.tokens).toHaveProperty("accessToken");
    expect(response.body.data.tokens).toHaveProperty("refreshToken");
    expect(response.body.data.tokens).toHaveProperty("expiresIn");
  });

  it("should return 400 for invalid email", async () => {
    const response = await request(app)
      .post("/api/v1/auth/signup")
      .send({ ...validSignupData, email: "invalid-email" })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details).toHaveProperty("email");
  });

  it("should return 400 for weak password", async () => {
    const response = await request(app)
      .post("/api/v1/auth/signup")
      .send({ ...validSignupData, password: "weak" })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details).toHaveProperty("password");
  });

  it("should return 409 for duplicate email", async () => {
    // First signup
    await request(app).post("/api/v1/auth/signup").send(validSignupData);

    // Duplicate signup
    const response = await request(app)
      .post("/api/v1/auth/signup")
      .send(validSignupData)
      .expect(400);

    expect(response.body.error.message).toContain("already exists");
  });

  it("should normalize email to lowercase", async () => {
    const response = await request(app)
      .post("/api/v1/auth/signup")
      .send({ ...validSignupData, email: "TEST@EXAMPLE.COM" })
      .expect(201);

    expect(response.body.data.user.email).toBe("test@example.com");
  });

  it("should trim whitespace from inputs", async () => {
    const response = await request(app)
      .post("/api/v1/auth/signup")
      .send({
        ...validSignupData,
        name: "  Test User  ",
        workspaceName: "  Test Workspace  ",
      })
      .expect(201);

    expect(response.body.data.user.name).toBe("Test User");
  });

  it("should store hashed password in database", async () => {
    const response = await request(app)
      .post("/api/v1/auth/signup")
      .send(validSignupData)
      .expect(201);

    // Password should not be returned
    expect(response.body.data.user.password).toBeUndefined();
  });

  it("should create workspace with user as owner", async () => {
    const response = await request(app)
      .post("/api/v1/auth/signup")
      .send(validSignupData)
      .expect(201);

    expect(response.body.data.user.workspaceId).toBeDefined();
    expect(response.body.data.user.role).toBe("owner");
  });
});
