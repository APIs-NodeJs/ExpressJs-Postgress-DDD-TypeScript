import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Application } from "express";

import { config } from "@config/env";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DevCycle API",
      version: "1.0.0",
      description:
        "DevCycle Backend API Documentation - Complete API reference for the DevCycle project management platform",
      contact: {
        name: "DevCycle Team",
        email: "support@devcycle.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: `http://localhost:${config.app.port}${config.app.apiPrefix}`,
        description: "Development server",
      },
      {
        url: `https://api.devcycle.com${config.app.apiPrefix}`,
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
                code: {
                  type: "string",
                  example: "BAD_REQUEST",
                },
                message: {
                  type: "string",
                  example: "Invalid request parameters",
                },
                details: {
                  type: "object",
                  additionalProperties: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
                requestId: {
                  type: "string",
                  format: "uuid",
                },
              },
            },
          },
        },
        User: {
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
            name: {
              type: "string",
            },
            avatar: {
              type: "string",
              format: "uri",
              nullable: true,
            },
            emailVerified: {
              type: "boolean",
            },
            workspaceId: {
              type: "string",
              format: "uuid",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                user: {
                  $ref: "#/components/schemas/User",
                },
                tokens: {
                  type: "object",
                  properties: {
                    accessToken: {
                      type: "string",
                    },
                    refreshToken: {
                      type: "string",
                    },
                    expiresIn: {
                      type: "number",
                      example: 3600,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "User authentication and authorization endpoints",
      },
      {
        name: "Users",
        description: "User management endpoints",
      },
      {
        name: "Settings",
        description: "User settings and preferences",
      },
      {
        name: "Health",
        description: "API health and monitoring endpoints",
      },
    ],
  },
  apis: [
    "./src/modules/*/presentation/routes/*.ts",
    "./src/infrastructure/http/routes/*.ts",
    "./src/infrastructure/http/controllers/*.ts",
  ],
};

const specs = swaggerJsdoc(options);

/**
 * Setup Swagger documentation
 */
export const setupSwagger = (app: Application): void => {
  // Swagger UI
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "DevCycle API Documentation",
    })
  );

  // JSON endpoint
  app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });

  console.info(
    `📚 API Documentation available at http://localhost:${config.app.port}/api/docs`
  );
};

export default setupSwagger;
