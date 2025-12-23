module.exports = {
  // Use ts-jest preset for TypeScript
  preset: "ts-jest",

  // Test environment
  testEnvironment: "node",

  // Roots
  roots: ["<rootDir>/tests"],

  // Test match patterns
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],

  // Transform files with ts-jest
  transform: {
    "^.+\\.ts$": "ts-jest",
  },

  // Module name mapper (match tsconfig paths)
  moduleNameMapper: {
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
    "^@modules/(.*)$": "<rootDir>/src/modules/$1",
    "^@infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
  },

  // Coverage collection
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/server.ts",
    "!src/**/*.interface.ts",
    "!src/**/*.type.ts",
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Coverage reporters
  coverageReporters: ["text", "lcov", "html"],

  // Coverage directory
  coverageDirectory: "coverage",

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

  // Global timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Detect open handles
  detectOpenHandles: true,

  // Force exit after tests complete
  forceExit: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
