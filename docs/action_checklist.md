# Devcycle API - Developer Action Checklist

**Priority Guide**: 🔴 Critical | 🟡 High | 🟢 Medium | ⚪ Low

---

## 🔴 CRITICAL PRIORITIES (Week 1-4)

### Week 1: Testing Foundation (Days 1-10)

#### Day 1-2: Test Infrastructure Setup
- [ ] Install testing dependencies
  ```bash
  npm install --save-dev jest @types/jest ts-jest
  npm install --save-dev supertest @types/supertest
  ```
- [ ] Create `jest.config.js`
  ```javascript
  module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    collectCoverageFrom: ['src/**/*.ts'],
    coverageThreshold: {
      global: { branches: 50, functions: 50, lines: 50 }
    }
  };
  ```
- [ ] Create test database setup script
- [ ] Add test scripts to package.json

#### Day 3-5: Unit Tests (Domain Layer)
- [ ] `tests/unit/domain/entities/User.test.ts`
  ```typescript
  describe('User Entity', () => {
    it('should create user with valid props');
    it('should generate UUID if not provided');
    it('should exclude password from DTO');
    it('should normalize email to lowercase');
  });
  ```
- [ ] `tests/unit/domain/entities/Workspace.test.ts`
- [ ] `tests/unit/infrastructure/PasswordHasher.test.ts`
- [ ] `tests/unit/infrastructure/TokenService.test.ts`

#### Day 6-8: Unit Tests (Use Cases)
- [ ] `tests/unit/use-cases/SignUpUseCase.test.ts`
  ```typescript
  describe('SignUpUseCase', () => {
    it('should create user and workspace successfully');
    it('should reject duplicate email');
    it('should reject weak password');
    it('should hash password before storing');
    it('should generate tokens on success');
    it('should rollback on workspace creation failure');
  });
  ```
- [ ] `tests/unit/use-cases/LoginUseCase.test.ts`
- [ ] `tests/unit/use-cases/RefreshTokenUseCase.test.ts`
- [ ] `tests/unit/use-cases/GetCurrentUserUseCase.test.ts`

#### Day 9-10: Integration Tests
- [ ] `tests/integration/auth/signup.integration.test.ts`
  ```typescript
  describe('POST /api/v1/auth/signup', () => {
    it('should create user and return tokens');
    it('should return 400 for invalid email');
    it('should return 409 for duplicate email');
    it('should store hashed password in database');
  });
  ```
- [ ] `tests/integration/auth/login.integration.test.ts`
- [ ] `tests/integration/auth/refresh.integration.test.ts`
- [ ] Run coverage: `npm run test:coverage`
- [ ] Target: 50%+ coverage

### Week 2: Observability (Days 11-15)

#### Day 11: Sentry Integration
- [ ] Sign up for Sentry account
- [ ] Install Sentry SDK
  ```bash
  npm install @sentry/node @sentry/tracing
  ```
- [ ] Add to `app.ts`
  ```typescript
  import * as Sentry from "@sentry/node";
  
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
  
  // Add after routes
  app.use(Sentry.Handlers.errorHandler());
  ```
- [ ] Test error capture
- [ ] Configure alert rules in Sentry dashboard

#### Day 12-13: Metrics Endpoint
- [ ] Create `src/infrastructure/monitoring/MetricsCollector.ts`
  ```typescript
  export class MetricsCollector {
    private requestCount = 0;
    private errorCount = 0;
    
    incrementRequests() { this.requestCount++; }
    incrementErrors() { this.errorCount++; }
    
    getMetrics() {
      return {
        totalRequests: this.requestCount,
        totalErrors: this.errorCount,
        errorRate: this.errorCount / this.requestCount,
      };
    }
  }
  ```
- [ ] Add metrics middleware
- [ ] Create `GET /metrics` endpoint
- [ ] Test metrics collection

#### Day 14-15: Logging Enhancement
- [ ] Set up log aggregation (CloudWatch/ELK)
- [ ] Add structured logging to all use cases
- [ ] Add security event logging
- [ ] Create monitoring dashboard
- [ ] Document logging strategy

### Week 3: Database Migrations (Days 16-20)

#### Day 16-17: Migration Setup
- [ ] Install sequelize-cli
  ```bash
  npm install --save-dev sequelize-cli
  ```
- [ ] Create `.sequelizerc`
  ```javascript
  module.exports = {
    'config': './src/config/database.json',
    'migrations-path': './database/migrations',
    'seeders-path': './database/seeders',
  };
  ```
- [ ] Initialize migrations
  ```bash
  npx sequelize-cli init:migrations
  ```

#### Day 18: Create Migrations
- [ ] Generate initial migration
  ```bash
  npx sequelize-cli migration:generate --name initial-schema
  ```
- [ ] Write up/down methods
  ```javascript
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      // Copy from schema.sql
    },
    down: async (queryInterface, Sequelize) => {
      // Rollback logic
    }
  };
  ```
- [ ] Test migration up/down

#### Day 19: Remove sync()
- [ ] Delete sync() from `database.ts`
  ```typescript
  // REMOVE THIS:
  if (env.NODE_ENV === "development") {
    await sequelize.sync({ alter: false });
  }
  ```
- [ ] Update database connection to use migrations only
- [ ] Test on fresh database

#### Day 20: Documentation
- [ ] Document migration workflow in README
- [ ] Create migration guide for team
- [ ] Add migration to CI/CD pipeline
- [ ] Update deployment documentation

### Week 4: RBAC Foundation (Days 21-25)

#### Day 21-22: Authorization Middleware
- [ ] Create `src/infrastructure/http/middlewares/authorize.ts`
  ```typescript
  import { Role } from '../../../config/constants';
  
  export function authorize(allowedRoles: Role[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw AppError.unauthorized('Authentication required');
      }
      
      if (!allowedRoles.includes(req.user.role)) {
        throw AppError.forbidden('Insufficient permissions');
      }
      
      next();
    };
  }
  ```
- [ ] Add to routes
  ```typescript
  router.delete(
    '/workspaces/:id',
    authenticate,
    authorize(['owner', 'admin']),
    asyncHandler(controller.deleteWorkspace)
  );
  ```
- [ ] Write authorization tests

#### Day 23-24: Permission System
- [ ] Create `src/modules/auth/domain/value-objects/Permission.ts`
  ```typescript
  export enum Permission {
    WORKSPACE_READ = 'workspace:read',
    WORKSPACE_WRITE = 'workspace:write',
    WORKSPACE_DELETE = 'workspace:delete',
    USER_INVITE = 'user:invite',
    USER_REMOVE = 'user:remove',
  }
  
  export const RolePermissions: Record<Role, Permission[]> = {
    owner: [/* all permissions */],
    admin: [/* limited permissions */],
    user: [/* read-only */],
  };
  ```
- [ ] Add permission checking utility
- [ ] Update middleware to check permissions

#### Day 25: Testing & Documentation
- [ ] Write authorization unit tests
- [ ] Write authorization integration tests
- [ ] Document RBAC system
- [ ] Create permission matrix diagram

---

## 🟡 HIGH PRIORITIES (Month 2)

### Week 5: Interface Extraction (Days 26-30)

#### Day 26-27: Repository Interfaces
- [ ] Create `src/modules/auth/domain/repositories/IUserRepository.ts`
  ```typescript
  export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(user: User, transaction?: Transaction): Promise<User>;
    update(id: string, updates: Partial<User>, transaction?: Transaction): Promise<User | null>;
    delete(id: string, transaction?: Transaction): Promise<boolean>;
  }
  ```
- [ ] Create `IWorkspaceRepository.ts`
- [ ] Update implementations to implement interfaces
- [ ] Update use cases to depend on interfaces

#### Day 28: Service Interfaces
- [ ] Create `src/modules/auth/domain/services/IPasswordHasher.ts`
  ```typescript
  export interface IPasswordHasher {
    hash(password: string): Promise<string>;
    compare(password: string, hash: string): Promise<boolean>;
  }
  ```
- [ ] Create `ITokenService.ts`
- [ ] Create `ILogger.ts`
- [ ] Update implementations

#### Day 29-30: Mock Implementations
- [ ] Create `tests/mocks/MockUserRepository.ts`
- [ ] Create `tests/mocks/MockPasswordHasher.ts`
- [ ] Create `tests/mocks/MockTokenService.ts`
- [ ] Update tests to use mocks
- [ ] Run full test suite

### Week 6: Dependency Injection (Days 31-35)

#### Day 31-32: DI Container Setup
- [ ] Install tsyringe
  ```bash
  npm install tsyringe reflect-metadata
  ```
- [ ] Create `src/infrastructure/di/container.ts`
  ```typescript
  import 'reflect-metadata';
  import { container } from 'tsyringe';
  import { IUserRepository } from '../../modules/auth/domain/repositories/IUserRepository';
  import { UserRepository } from '../../modules/auth/infrastructure/repositories/UserRepository';
  
  container.register<IUserRepository>('IUserRepository', {
    useClass: UserRepository
  });
  ```
- [ ] Register all dependencies

#### Day 33-34: Refactor Routes
- [ ] Update `authRoutes.ts` to use DI
  ```typescript
  import { container } from '../../../infrastructure/di/container';
  
  const authController = container.resolve(AuthController);
  ```
- [ ] Add `@injectable()` decorators to classes
  ```typescript
  import { injectable, inject } from 'tsyringe';
  
  @injectable()
  export class SignUpUseCase {
    constructor(
      @inject('IUserRepository') private userRepo: IUserRepository,
      @inject('IPasswordHasher') private passwordHasher: IPasswordHasher,
    ) {}
  }
  ```

#### Day 35: Testing & Cleanup
- [ ] Update all tests for DI
- [ ] Remove manual instantiation
- [ ] Test full application
- [ ] Document DI usage

### Week 7: API Documentation (Days 36-40)

#### Day 36-37: Swagger Setup
- [ ] Install dependencies
  ```bash
  npm install swagger-jsdoc swagger-ui-express
  npm install --save-dev @types/swagger-jsdoc @types/swagger-ui-express
  ```
- [ ] Create `src/infrastructure/documentation/swagger.ts`
  ```typescript
  import swaggerJsdoc from 'swagger-jsdoc';
  
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Devcycle API',
        version: '1.0.0',
        description: 'Production-ready authentication API',
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Development' },
        { url: 'https://api.yourdomain.com', description: 'Production' },
      ],
    },
    apis: ['./src/**/*.ts'],
  };
  
  export const swaggerSpec = swaggerJsdoc(options);
  ```

#### Day 38-39: Document Endpoints
- [ ] Add JSDoc comments to all routes
  ```typescript
  /**
   * @swagger
   * /api/v1/auth/signup:
   *   post:
   *     summary: Create new user account
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password, name, workspaceName]
   *             properties:
   *               email: { type: string, format: email }
   *               password: { type: string, minLength: 8 }
   *     responses:
   *       201:
   *         description: User created successfully
   *       400:
   *         description: Validation error
   */
  ```
- [ ] Document all auth endpoints
- [ ] Document error responses
- [ ] Add example payloads

#### Day 40: Postman & Cleanup
- [ ] Create Postman collection
- [ ] Add Swagger UI route
  ```typescript
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  ```
- [ ] Test documentation
- [ ] Share with team

### Week 8: Email Verification (Days 41-45)

#### Day 41-42: Email Service Abstraction
- [ ] Create `src/shared/infrastructure/email/IEmailService.ts`
  ```typescript
  export interface IEmailService {
    sendVerificationEmail(to: string, token: string): Promise<void>;
    sendPasswordResetEmail(to: string, token: string): Promise<void>;
  }
  ```
- [ ] Create mock implementation for dev
- [ ] Create email templates
- [ ] Add to DI container

#### Day 43-44: Verification Endpoints
- [ ] Add verification token to User entity
- [ ] Create `VerifyEmailUseCase`
- [ ] Create `ResendVerificationUseCase`
- [ ] Add routes
  ```typescript
  POST /api/v1/auth/verify-email
  POST /api/v1/auth/resend-verification
  ```
- [ ] Update signup to send verification email

#### Day 45: Testing
- [ ] Write verification tests
- [ ] Test email sending (mock)
- [ ] Update integration tests
- [ ] Document verification flow

---

## 🟢 MEDIUM PRIORITIES (Month 3)

### Week 9: Password Reset (Days 46-50)

- [ ] Add reset token generation
- [ ] Create `ForgotPasswordUseCase`
- [ ] Create `ResetPasswordUseCase`
- [ ] Add endpoints:
  ```typescript
  POST /api/v1/auth/forgot-password
  POST /api/v1/auth/reset-password
  ```
- [ ] Write tests
- [ ] Document flow

### Week 10: Workspace Management (Days 51-60)

#### Workspace CRUD
- [ ] Create `WorkspaceModule`
- [ ] Add use cases:
  - GetWorkspaceUseCase
  - UpdateWorkspaceUseCase
  - DeleteWorkspaceUseCase
- [ ] Add endpoints:
  ```typescript
  GET    /api/v1/workspaces/:id
  PUT    /api/v1/workspaces/:id
  DELETE /api/v1/workspaces/:id
  ```

#### Member Management
- [ ] Create `InviteUserUseCase`
- [ ] Create `RemoveUserUseCase`
- [ ] Create `ListWorkspaceMembersUseCase`
- [ ] Add endpoints:
  ```typescript
  POST /api/v1/workspaces/:id/invite
  DELETE /api/v1/workspaces/:id/members/:userId
  GET /api/v1/workspaces/:id/members
  ```

### Week 11: Caching Layer (Days 61-65)

- [ ] Install Redis
  ```bash
  npm install redis
  npm install --save-dev @types/redis
  ```
- [ ] Create `CacheService`
- [ ] Add session caching
- [ ] Move rate limiting to Redis
- [ ] Add query result caching
- [ ] Performance testing

### Week 12: Audit Logging (Days 66-70)

- [ ] Create audit_logs table migration
- [ ] Create `AuditLogRepository`
- [ ] Create audit middleware
- [ ] Log sensitive operations
- [ ] Add query endpoint
- [ ] Write tests

---

## ⚪ LONG-TERM IMPROVEMENTS (Month 4+)

### Two-Factor Authentication
- [ ] Install speakeasy (TOTP)
- [ ] Add 2FA enrollment flow
- [ ] Add 2FA verification
- [ ] Generate backup codes
- [ ] Add endpoints

### Performance Optimization
- [ ] Add pagination to all list endpoints
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Load testing with Artillery
- [ ] Performance baseline documentation

### Value Objects (Architecture Improvement)
- [ ] Create `Email` value object
- [ ] Create `Password` value object
- [ ] Create `WorkspaceName` value object
- [ ] Update entities to use value objects
- [ ] Centralize validation

### Advanced Security
- [ ] Token blacklist (Redis)
- [ ] Account lockout mechanism
- [ ] Refresh token rotation
- [ ] Password history check
- [ ] Security audit

---

## 📊 Progress Tracking

### Weekly Review Checklist

**Every Monday:**
- [ ] Review test coverage (target: +5% per week)
- [ ] Review Sentry error count (target: 0 new errors)
- [ ] Review performance metrics
- [ ] Update roadmap

**Every Friday:**
- [ ] Demo completed features
- [ ] Update documentation
- [ ] Code review backlog
- [ ] Plan next week

### Milestones

**Month 1 Complete:**
- [ ] 70%+ test coverage
- [ ] Sentry monitoring live
- [ ] Migrations in use
- [ ] Zero production sync() calls

**Month 2 Complete:**
- [ ] RBAC enforced on all routes
- [ ] All interfaces extracted
- [ ] DI container in use
- [ ] API fully documented

**Month 3 Complete:**
- [ ] Email verification live
- [ ] Password reset live
- [ ] Workspace management complete
- [ ] Redis caching operational

**Month 4 Complete:**
- [ ] Audit logging active
- [ ] 2FA available
- [ ] Performance optimized
- [ ] Load tested to 1000 RPS

---

## 🚨 Blockers & Escalation

### When to Escalate
- [ ] Test coverage not increasing
- [ ] Production errors in Sentry
- [ ] Database migration failures
- [ ] Security vulnerabilities found
- [ ] Performance degradation

### Escalation Path
1. **Daily Standup** - Minor blockers
2. **Tech Lead** - Technical decisions
3. **Manager** - Resource needs
4. **Security Team** - Security issues

---

## 📝 Notes & Tips

### Testing Tips
```bash
# Run specific test
npm test -- User.test.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Debug test
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Migration Tips
```bash
# Create migration
npx sequelize-cli migration:generate --name add-email-verified

# Run migrations
npx sequelize-cli db:migrate

# Rollback
npx sequelize-cli db:migrate:undo

# Status
npx sequelize-cli db:migrate:status
```

### Docker Tips
```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# View logs
docker-compose logs -f

# Clean up
docker-compose down -v
```

---

**Last Updated**: December 24, 2025  
**Next Review**: Weekly on Mondays  
**Owner**: Development Team
