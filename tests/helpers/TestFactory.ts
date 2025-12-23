import { User } from '@modules/auth/domain/entities/User';
import { Email } from '@modules/auth/domain/value-objects/Email';
import { Password } from '@modules/auth/domain/value-objects/Password';
import { Workspace } from '@modules/auth/domain/entities/Workspace';
import { v4 as uuidv4 } from 'uuid';

export class TestFactory {
  static async createUser(overrides?: {
    email?: string;
    password?: string;
    name?: string;
    workspaceId?: string;
    emailVerified?: boolean;
  }) {
    const email = Email.create(overrides?.email || `test${uuidv4()}@example.com`).getValue();
    const password = Password.createHashed(
      overrides?.password || '$2b$12$hashedPassword'
    ).getValue();

    return User.create({
      email,
      password,
      name: overrides?.name || 'Test User',
      workspaceId: overrides?.workspaceId || uuidv4(),
      emailVerified: overrides?.emailVerified ?? false,
    });
  }

  static createWorkspace(overrides?: {
    name?: string;
    ownerId?: string;
    slug?: string;
  }) {
    return Workspace.create({
      name: overrides?.name || 'Test Workspace',
      ownerId: overrides?.ownerId || uuidv4(),
      slug: overrides?.slug,
    });
  }

  static generateToken(): string {
    return `test_token_${uuidv4()}`;
  }
}

// tests/helpers/MockRepositories.ts

import { IUserRepository } from '@modules/auth/domain/repositories/IUserRepository';
import { User } from '@modules/auth/domain/entities/User';
import { Email } from '@modules/auth/domain/value-objects/Email';

export class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    return Array.from(this.users.values()).find(
      (user) => user.email.equals(email)
    ) || null;
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.users.has(id);
  }

  // Test helpers
  clear(): void {
    this.users.clear();
  }

  getAll(): User[] {
    return Array.from(this.users.values());
  }
}

// tests/unit/auth/use-cases/LoginUseCase.test.ts

import { LoginUseCase } from '@modules/auth/application/use-cases/LoginUseCase';
import { MockUserRepository } from '../../../helpers/MockRepositories';
import { TestFactory } from '../../../helpers/TestFactory';
import { PasswordHasher } from '@modules/auth/infrastructure/security/PasswordHasher';
import { InvalidCredentialsError } from '@shared/domain/errors/DomainErrors';

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let mockUserRepository: MockUserRepository;

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    loginUseCase = new LoginUseCase(mockUserRepository);
  });

  describe('execute', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const plainPassword = 'Test123!@#';
      const hashedPassword = await PasswordHasher.hash(plainPassword);
      const user = await TestFactory.createUser({
        email: 'test@example.com',
        password: hashedPassword,
        emailVerified: true,
      });
      
      await mockUserRepository.save(user);

      const request = {
        email: 'test@example.com',
        password: plainPassword,
      };

      // Act
      const result = await loginUseCase.execute(request);

      // Assert
      expect(result.isSuccess).toBe(true);
      const data = result.getValue();
      expect(data.user.email).toBe('test@example.com');
      expect(data.tokens).toHaveProperty('accessToken');
      expect(data.tokens).toHaveProperty('refreshToken');
    });

    it('should throw InvalidCredentialsError for non-existent user', async () => {
      // Arrange
      const request = {
        email: 'nonexistent@example.com',
        password: 'Test123!@#',
      };

      // Act & Assert
      await expect(loginUseCase.execute(request)).rejects.toThrow(
        InvalidCredentialsError
      );
    });

    it('should throw InvalidCredentialsError for incorrect password', async () => {
      // Arrange
      const plainPassword = 'Test123!@#';
      const hashedPassword = await PasswordHasher.hash(plainPassword);
      const user = await TestFactory.createUser({
        email: 'test@example.com',
        password: hashedPassword,
      });
      
      await mockUserRepository.save(user);

      const request = {
        email: 'test@example.com',
        password: 'WrongPassword123',
      };

      // Act & Assert
      await expect(loginUseCase.execute(request)).rejects.toThrow(
        InvalidCredentialsError
      );
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      const plainPassword = 'Test123!@#';
      const hashedPassword = await PasswordHasher.hash(plainPassword);
      const user = await TestFactory.createUser({
        email: 'test@example.com',
        password: hashedPassword,
      });
      
      await mockUserRepository.save(user);

      const request = {
        email: 'TEST@EXAMPLE.COM',
        password: plainPassword,
      };

      // Act
      const result = await loginUseCase.execute(request);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.getValue().user.email).toBe('test@example.com');
    });
  });
});

// tests/integration/auth/AuthController.test.ts

import request from 'supertest';
import { createApp } from '../../../src/app';
import { initializeDatabase, sequelize } from '../../../src/infrastructure/database/sequelize';
import { RedisClient } from '../../../src/infrastructure/cache/redis';

describe('Auth Controller Integration Tests', () => {
  const app = createApp();
  let testUser: any;
  let testToken: string;

  beforeAll(async () => {
    await initializeDatabase();
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
    await RedisClient.disconnect();
  });

  beforeEach(async () => {
    // Clear database before each test
    await sequelize.sync({ force: true });
  });

  describe('POST /api/v1/auth/signup', () => {
    it('should create a new user and return tokens', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          name: 'New User',
          workspaceName: 'New Workspace',
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.tokens.accessToken).toBeTruthy();
      expect(response.body.data.tokens.refreshToken).toBeTruthy();

      testUser = response.body.data.user;
      testToken = response.body.data.tokens.accessToken;
    });

    it('should reject duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'Password123!',
          name: 'First User',
        });

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'duplicate@example.com',
          password: 'Password123!',
          name: 'Second User',
        })
        .expect(400);

      expect(response.body.error.message).toContain('already exists');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'weak@example.com',
          password: 'weak',
          name: 'Weak Password User',
        })
        .expect(400);

      expect(response.body.error.code).toBe('BAD_REQUEST');
      expect(response.body.error.details).toHaveProperty('password');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          name: 'Invalid Email User',
        })
        .expect(400);

      expect(response.body.error.code).toBe('BAD_REQUEST');
      expect(response.body.error.details).toHaveProperty('email');
    });

    it('should automatically assign admin role to workspace owner', async () => {
      const signupResponse = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'owner@example.com',
          password: 'Password123!',
          name: 'Owner User',
        })
        .expect(201);

      const token = signupResponse.body.data.tokens.accessToken;

      // Check user's role
      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meResponse.body.data.role).toBe('admin');
      expect(meResponse.body.data.permissions).toContain('admin:access');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'logintest@example.com',
          password: 'Password123!',
          name: 'Login Test User',
        });

      testUser = response.body.data.user;
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.data.user.email).toBe('logintest@example.com');
      expect(response.body.data.tokens.accessToken).toBeTruthy();
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should lock account after 5 failed attempts', async () => {
      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'logintest@example.com',
            password: 'WrongPassword',
          })
          .expect(401);
      }

      // 6th attempt should return account locked error
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'Password123!', // Even with correct password
        })
        .expect(401);

      expect(response.body.error.message).toContain('locked');
    });

    it('should be case-insensitive for email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'LOGINTEST@EXAMPLE.COM',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.data.user.email).toBe('logintest@example.com');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'metest@example.com',
          password: 'Password123!',
          name: 'Me Test User',
        });

      testToken = response.body.data.tokens.accessToken;
    });

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.data.email).toBe('metest@example.com');
      expect(response.body.data).toHaveProperty('role');
      expect(response.body.data).toHaveProperty('permissions');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});

