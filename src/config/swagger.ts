// src/config/swagger.ts

export const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Express DDD API",
    version: "1.0.0",
    description:
      "RESTful API built with Express.js, TypeScript, and Domain-Driven Design",
    contact: {
      name: "API Support",
      email: "support@example.com",
      url: "https://example.com/support",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
    {
      url: "https://staging-api.example.com",
      description: "Staging server",
    },
    {
      url: "https://api.example.com",
      description: "Production server",
    },
  ],
  tags: [
    {
      name: "Authentication",
      description: "User authentication endpoints",
    },
    {
      name: "Users",
      description: "User management endpoints",
    },
    {
      name: "Workspaces",
      description: "Workspace management endpoints",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token",
      },
    },
    schemas: {
      // Success Response
      SuccessResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            type: "object",
            description: "Response data",
          },
          message: {
            type: "string",
            example: "Operation successful",
          },
          requestId: {
            type: "string",
            format: "uuid",
          },
          timestamp: {
            type: "string",
            format: "date-time",
          },
        },
      },
      // Error Response
      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "object",
            properties: {
              code: {
                type: "string",
                example: "VALIDATION_ERROR",
              },
              message: {
                type: "string",
                example: "Validation failed",
              },
              details: {
                type: "object",
                description: "Additional error details",
              },
            },
          },
          requestId: {
            type: "string",
            format: "uuid",
          },
          timestamp: {
            type: "string",
            format: "date-time",
          },
        },
      },
      // User
      User: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            description: "User unique identifier",
          },
          email: {
            type: "string",
            format: "email",
            description: "User email address",
          },
          workspaceId: {
            type: "string",
            format: "uuid",
            description: "User's workspace ID",
          },
          status: {
            type: "string",
            enum: ["PENDING", "ACTIVE", "SUSPENDED", "DELETED"],
            description: "User account status",
          },
          emailVerified: {
            type: "boolean",
            description: "Whether email is verified",
          },
          firstName: {
            type: "string",
            description: "User first name",
          },
          lastName: {
            type: "string",
            description: "User last name",
          },
          fullName: {
            type: "string",
            description: "User full name",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Account creation timestamp",
          },
        },
      },
      // Sign Up Request
      SignUpRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            description: "User email address",
            example: "john.doe@example.com",
          },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            description:
              "User password (min 8 chars, must include uppercase, lowercase, and number)",
            example: "SecurePass123",
          },
          firstName: {
            type: "string",
            maxLength: 100,
            description: "User first name",
            example: "John",
          },
          lastName: {
            type: "string",
            maxLength: 100,
            description: "User last name",
            example: "Doe",
          },
        },
      },
      // Login Request
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            description: "User email address",
            example: "john.doe@example.com",
          },
          password: {
            type: "string",
            format: "password",
            description: "User password",
            example: "SecurePass123",
          },
        },
      },
      // Login Response
      LoginResponse: {
        allOf: [
          { $ref: "#/components/schemas/SuccessResponse" },
          {
            type: "object",
            properties: {
              data: {
                type: "object",
                properties: {
                  accessToken: {
                    type: "string",
                    description: "JWT access token",
                  },
                  refreshToken: {
                    type: "string",
                    description: "JWT refresh token",
                  },
                  user: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        format: "uuid",
                      },
                      email: {
                        type: "string",
                        format: "email",
                      },
                    },
                  },
                  expiresIn: {
                    type: "number",
                    description: "Token expiration time in milliseconds",
                  },
                },
              },
            },
          },
        ],
      },
      // Pagination
      PaginationMeta: {
        type: "object",
        properties: {
          page: {
            type: "integer",
            example: 1,
          },
          limit: {
            type: "integer",
            example: 10,
          },
          total: {
            type: "integer",
            example: 100,
          },
          totalPages: {
            type: "integer",
            example: 10,
          },
          hasNextPage: {
            type: "boolean",
            example: true,
          },
          hasPreviousPage: {
            type: "boolean",
            example: false,
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: "Authentication required or token invalid",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              success: false,
              error: {
                code: "UNAUTHORIZED",
                message: "Authentication required",
              },
              requestId: "550e8400-e29b-41d4-a716-446655440000",
              timestamp: "2025-12-27T10:30:00.000Z",
            },
          },
        },
      },
      ForbiddenError: {
        description: "Insufficient permissions",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      NotFoundError: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      ValidationError: {
        description: "Validation failed",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: [
                  {
                    field: "email",
                    message: "Invalid email format",
                  },
                ],
              },
              requestId: "550e8400-e29b-41d4-a716-446655440000",
              timestamp: "2025-12-27T10:30:00.000Z",
            },
          },
        },
      },
      RateLimitError: {
        description: "Too many requests",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
      InternalServerError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/auth/signup": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        description: "Create a new user account with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/SignUpRequest",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User created successfully",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: {
                            userId: {
                              type: "string",
                              format: "uuid",
                            },
                            workspaceId: {
                              type: "string",
                              format: "uuid",
                            },
                            email: {
                              type: "string",
                              format: "email",
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": {
            $ref: "#/components/responses/ValidationError",
          },
          "409": {
            description: "User already exists",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "429": {
            $ref: "#/components/responses/RateLimitError",
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login user",
        description: "Authenticate user and receive JWT tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LoginResponse",
                },
              },
            },
          },
          "401": {
            $ref: "#/components/responses/UnauthorizedError",
          },
          "429": {
            $ref: "#/components/responses/RateLimitError",
          },
        },
      },
    },
    "/api/auth/profile": {
      get: {
        tags: ["Authentication"],
        summary: "Get user profile",
        description: "Get authenticated user's profile information",
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Profile retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          $ref: "#/components/schemas/User",
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": {
            $ref: "#/components/responses/UnauthorizedError",
          },
          "404": {
            $ref: "#/components/responses/NotFoundError",
          },
        },
      },
    },
  },
};

// ==========================================
// Swagger Setup Function
// ==========================================

/*
// Install required packages:
npm install swagger-ui-express swagger-jsdoc

// src/config/swagger.ts (continued)
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Application } from "express";

export function setupSwagger(app: Application): void {
  const options = {
    definition: swaggerDefinition,
    apis: ["./src/modules/**\/*.ts"], // Path to API docs
  };

  const specs = swaggerJsdoc(options);

  // Swagger UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Express DDD API Documentation",
  }));

  // JSON endpoint
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });

  console.log("📚 Swagger documentation available at /api-docs");
}

// In app.ts:
import { setupSwagger } from "./config/swagger";

// After configuring routes:
setupSwagger(this.app);
*/
