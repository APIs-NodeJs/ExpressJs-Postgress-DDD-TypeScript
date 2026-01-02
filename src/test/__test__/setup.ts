process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-minimum-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-minimum-32-characters-long';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'test_db';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.DB_PORT = '5432';

beforeAll(async () => {
  // Global test setup
});

afterAll(async () => {
  // Global test teardown
});

beforeEach(() => {
  // Before each test
});

afterEach(() => {
  // After each test
  jest.clearAllMocks();
});