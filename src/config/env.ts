export const config = {
  app: {
    name: "DevCycle API",
    env: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3000", 10),
    apiPrefix: "/api/v1",
  },
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    name: process.env.DB_NAME || "devcycle",
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    logging: process.env.DB_LOGGING === "true",
  },
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || "access-secret-key",
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || "refresh-secret-key",
    accessTokenExpiry: "1h",
    refreshTokenExpiry: "7d",
  },
  security: {
    bcryptRounds: 12,
    passwordMinLength: 8,
  },
  cors: {
    enabled: process.env.CORS_ENABLED !== "false",
    origin: process.env.CORS_ORIGIN || "http://localhost:8080",
    credentials: true,
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(",")
      : ["http://localhost:8080"],
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
  },
};
