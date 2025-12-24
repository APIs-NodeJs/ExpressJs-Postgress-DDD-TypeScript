import swaggerJsdoc from "swagger-jsdoc";
import { env } from "../../config/env";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Devcycle API",
      version: "1.0.0",
      description:
        "Production-ready RESTful authentication API with workspace management",
      contact: {
        name: "API Support",
        email: "support@devcycle.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: "Development server",
      },
      {
        url: "https://api.yourdomain.com",
        description: "Production server",
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
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "VALIDATION_ERROR" },
                message: { type: "string", example: "Validation failed" },
                details: { type: "object" },
                requestId: { type: "string", format: "uuid" },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            role: { type: "string", enum: ["owner", "admin", "user"] },
            workspaceId: { type: "string", format: "uuid" },
          },
        },
        Tokens: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
            expiresIn: { type: "number", example: 900 },
          },
        },
      },
    },
    tags: [
      { name: "Authentication", description: "User authentication endpoints" },
      { name: "Health", description: "Health check endpoints" },
    ],
  },
  apis: ["./src/**/*.ts"], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
