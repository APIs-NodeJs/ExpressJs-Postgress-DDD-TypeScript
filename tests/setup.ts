import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'myapp_test';
process.env.LOG_LEVEL = 'error';

// Global test timeout
jest.setTimeout(10000);

// Mock logger to reduce noise in tests
jest.mock('../src/core/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
  },
  logStartup: jest.fn(),
  logDatabaseConnection: jest.fn(),
  logRedisConnection: jest.fn(),
  logServerListening: jest.fn(),
  loggerStream: {
    write: jest.fn(),
  },
}));

// Global setup
beforeAll(async () => {
  // Add global setup logic here
});

// Global teardown
afterAll(async () => {
  // Add global teardown logic here
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
