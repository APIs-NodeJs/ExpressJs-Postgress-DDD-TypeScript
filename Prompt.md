# 🚀 Production Node.js REST API

## 📋 Executive Summary

Generate a **complete, enterprise-grade Node.js REST API** following industry best practices, clean architecture principles, and production-ready patterns. This is NOT a tutorial or pseudo-code exercise—every file must contain **real, executable code** ready for deployment.

---

## 🎯 Technical Requirements

### Core Technology Stack

```yaml
Runtime: Node.js 20+ LTS
Framework: Express.js 4.x
Database: PostgreSQL 15+
ORM: Sequelize 6.x
Authentication: JWT + Refresh Tokens
Real-time: Socket.IO 4.x
Caching: Redis 7.x
Testing: Jest 29.x + Supertest
Validation: Joi or Zod
Documentation: OpenAPI/Swagger 3.0
Containerization: Docker + Docker Compose
```

### Architecture Patterns (Non-Negotiable)

- ✅ **Domain-Driven Design (DDD)** - Bounded contexts for each business domain
- ✅ **Clean Architecture (Hexagonal)** - Framework-independent business logic
- ✅ **SOLID Principles** - Single responsibility, dependency inversion
- ✅ **Repository Pattern** - Abstract data access layer
- ✅ **Dependency Injection** - Loose coupling between components
- ✅ **CQRS** (Optional) - Separate read/write models for complex domains
- ✅ **Event-Driven** - Domain events for cross-module communication

---

## 🏗️ Project Structure

```
project-root/
├── src/
│   ├── core/                          # Framework infrastructure
│   │   ├── config/                    # Configuration files
│   │   │   ├── database.js           # Sequelize config
│   │   │   ├── server.js             # Express server setup
│   │   │   ├── redis.js              # Redis client
│   │   │   ├── socket.js             # Socket.IO config
│   │   │   └── logger.js             # Winston logger
│   │   │
│   │   ├── infrastructure/
│   │   │   ├── database/
│   │   │   │   ├── sequelize.js      # DB instance
│   │   │   │   ├── migrations/       # Schema migrations
│   │   │   │   └── seeders/          # Initial data
│   │   │   ├── cache/
│   │   │   │   └── RedisCache.js     # Caching service
│   │   │   ├── events/
│   │   │   │   ├── EventEmitter.js   # Domain events
│   │   │   │   └── EventBus.js       # Event distribution
│   │   │   └── websocket/
│   │   │       ├── SocketManager.js  # Socket.IO manager
│   │   │       └── SocketAuth.js     # WS authentication
│   │   │
│   │   ├── middleware/               # Global middleware
│   │   │   ├── errorHandler.js      # Global error handler
│   │   │   ├── requestLogger.js     # HTTP logging
│   │   │   ├── rateLimiter.js       # Rate limiting
│   │   │   ├── cors.js              # CORS policy
│   │   │   ├── helmet.js            # Security headers
│   │   │   └── validation.js        # Input validation
│   │   │
│   │   ├── errors/                   # Custom error classes
│   │   │   ├── AppError.js          # Base error
│   │   │   ├── ValidationError.js   # 400 errors
│   │   │   ├── UnauthorizedError.js # 401 errors
│   │   │   ├── ForbiddenError.js    # 403 errors
│   │   │   ├── NotFoundError.js     # 404 errors
│   │   │   └── ConflictError.js     # 409 errors
│   │   │
│   │   ├── utils/                    # Helper utilities
│   │   │   ├── crypto.js            # Encryption utils
│   │   │   ├── jwt.js               # JWT helpers
│   │   │   ├── password.js          # Password hashing
│   │   │   ├── validator.js         # Custom validators
│   │   │   └── response.js          # API response formatter
│   │   │
│   │   └── bootstrap/                # Application initialization
│   │       ├── app.js               # Express app factory
│   │       ├── routes.js            # Route registry
│   │       └── container.js         # DI container
│   │
│   ├── modules/                      # Business domains (DDD)
│   │   │
│   │   ├── auth/                     # Authentication Context
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── RefreshToken.js
│   │   │   │   │   └── Session.js
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── Email.js
│   │   │   │   │   ├── Password.js
│   │   │   │   │   └── Token.js
│   │   │   │   ├── repositories/
│   │   │   │   │   └── IRefreshTokenRepository.js
│   │   │   │   └── events/
│   │   │   │       ├── UserLoggedIn.js
│   │   │   │       └── UserRegistered.js
│   │   │   │
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── RegisterUser.js
│   │   │   │   │   ├── LoginUser.js
│   │   │   │   │   ├── RefreshToken.js
│   │   │   │   │   ├── ForgotPassword.js
│   │   │   │   │   └── ResetPassword.js
│   │   │   │   ├── dto/
│   │   │   │   │   ├── RegisterUserDto.js
│   │   │   │   │   └── AuthResponseDto.js
│   │   │   │   └── services/
│   │   │   │       ├── TokenService.js
│   │   │   │       ├── PasswordService.js
│   │   │   │       └── EmailService.js
│   │   │   │
│   │   │   ├── infrastructure/
│   │   │   │   ├── models/
│   │   │   │   │   └── RefreshTokenModel.js
│   │   │   │   ├── repositories/
│   │   │   │   │   └── SequelizeRefreshTokenRepository.js
│   │   │   │   └── migrations/
│   │   │   │       └── 001-create-refresh-tokens.js
│   │   │   │
│   │   │   ├── presentation/
│   │   │   │   ├── controllers/
│   │   │   │   │   └── AuthController.js
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── authenticate.js
│   │   │   │   │   └── requireAuth.js
│   │   │   │   ├── routes/
│   │   │   │   │   └── auth.routes.js
│   │   │   │   └── validators/
│   │   │   │       ├── register.validator.js
│   │   │   │       └── login.validator.js
│   │   │   │
│   │   │   └── tests/
│   │   │       ├── unit/
│   │   │       │   └── LoginUser.test.js
│   │   │       └── integration/
│   │   │           └── auth.routes.test.js
│   │   │
│   │   ├── user/                     # User Management Context
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── User.js
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── UserProfile.js
│   │   │   │   │   └── UserStatus.js
│   │   │   │   └── repositories/
│   │   │   │       └── IUserRepository.js
│   │   │   ├── application/
│   │   │   │   └── use-cases/
│   │   │   │       ├── GetUserProfile.js
│   │   │   │       ├── UpdateUserProfile.js
│   │   │   │       └── ListUsers.js
│   │   │   ├── infrastructure/
│   │   │   │   ├── models/
│   │   │   │   │   └── UserModel.js
│   │   │   │   └── repositories/
│   │   │   │       └── SequelizeUserRepository.js
│   │   │   ├── presentation/
│   │   │   │   ├── controllers/
│   │   │   │   │   └── UserController.js
│   │   │   │   └── routes/
│   │   │   │       └── user.routes.js
│   │   │   └── tests/
│   │   │
│   │   ├── workspace/                # Multi-Tenant Context
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── Workspace.js
│   │   │   │   │   ├── WorkspaceMember.js
│   │   │   │   │   └── Invitation.js
│   │   │   │   └── repositories/
│   │   │   │       └── IWorkspaceRepository.js
│   │   │   ├── application/
│   │   │   │   └── use-cases/
│   │   │   │       ├── CreateWorkspace.js
│   │   │   │       ├── InviteMember.js
│   │   │   │       └── SwitchWorkspace.js
│   │   │   ├── infrastructure/
│   │   │   ├── presentation/
│   │   │   │   └── middleware/
│   │   │   │       ├── tenantContext.js
│   │   │   │       └── requireWorkspace.js
│   │   │   └── tests/
│   │   │
│   │   └── role/                     # RBAC Context
│   │       ├── domain/
│   │       │   ├── entities/
│   │       │   │   ├── Role.js
│   │       │   │   └── Permission.js
│   │       │   └── repositories/
│   │       │       └── IRoleRepository.js
│   │       ├── application/
│   │       │   └── use-cases/
│   │       │       ├── CreateRole.js
│   │       │       ├── AssignPermission.js
│   │       │       └── CheckPermission.js
│   │       ├── infrastructure/
│   │       ├── presentation/
│   │       │   └── middleware/
│   │       │       └── requirePermission.js
│   │       └── tests/
│   │
│   └── server.js                     # Application entry point
│
├── tests/
│   ├── e2e/                          # End-to-end tests
│   ├── fixtures/                     # Test data
│   └── setup.js                      # Test configuration
│
├── docs/                             # Documentation
│   ├── api/                          # API documentation
│   ├── architecture/                 # Architecture diagrams
│   └── deployment/                   # Deployment guides
│
├── scripts/                          # Utility scripts
│   ├── seed-database.js
│   ├── create-admin.js
│   └── migrate.js
│
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── jest.config.js
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

---

## 🔐 Security Requirements

### Must Implement

- ✅ **Password Security**: bcrypt with salt rounds ≥ 12
- ✅ **JWT Security**: Short-lived access tokens (15min) + long-lived refresh tokens (7d)
- ✅ **Rate Limiting**: IP-based limiting (100 req/15min default)
- ✅ **Input Validation**: Joi/Zod schemas for ALL endpoints
- ✅ **SQL Injection Prevention**: Parameterized queries only (Sequelize ORM)
- ✅ **XSS Protection**: Helmet.js middleware
- ✅ **CSRF Protection**: CSRF tokens for state-changing operations
- ✅ **CORS Configuration**: Strict origin whitelist
- ✅ **Secret Management**: Environment variables only (never hardcoded)
- ✅ **Audit Logging**: Track all authentication and authorization events

---

## 📊 Database Schema Principles

### Multi-Tenancy Strategy

```sql
-- Every tenant-scoped table MUST include:
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  email VARCHAR(255) NOT NULL,
  -- ... other fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_email_per_workspace UNIQUE (workspace_id, email)
);

-- Composite indexes for performance
CREATE INDEX idx_users_workspace ON users(workspace_id);
CREATE INDEX idx_users_email ON users(email);
```

### Soft Deletes

```sql
-- Use deleted_at pattern for audit trail
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL;
```

---

## 🧪 Testing Requirements

### Coverage Targets

- **Unit Tests**: ≥ 80% coverage for business logic
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows (auth, workspace creation)

### Test Structure

```javascript
// Unit Test Example
describe("LoginUser Use Case", () => {
  let loginUser;
  let mockUserRepository;
  let mockTokenService;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
    };
    mockTokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
    };
    loginUser = new LoginUser(mockUserRepository, mockTokenService);
  });

  it("should return tokens for valid credentials", async () => {
    // Arrange
    const user = { id: "123", email: "test@example.com", password: "hashed" };
    mockUserRepository.findByEmail.mockResolvedValue(user);
    mockTokenService.generateAccessToken.mockReturnValue("access-token");
    mockTokenService.generateRefreshToken.mockReturnValue("refresh-token");

    // Act
    const result = await loginUser.execute({
      email: "test@example.com",
      password: "password123",
    });

    // Assert
    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
  });

  it("should throw UnauthorizedError for invalid password", async () => {
    // Test implementation
  });
});
```

---

## 🚀 Implementation Instructions

### Phase 1: Core Infrastructure (Start Here)

**Generate complete, production-ready code for:**

1. **Server Setup**

   - Express application factory (`src/core/bootstrap/app.js`)
   - Server configuration (`src/core/config/server.js`)
   - Entry point (`src/server.js`)

2. **Database Setup**

   - Sequelize configuration (`src/core/config/database.js`)
   - Connection instance (`src/core/infrastructure/database/sequelize.js`)
   - Migration runner script

3. **Error Handling System**

   - Base error class (`src/core/errors/AppError.js`)
   - All error subclasses (ValidationError, UnauthorizedError, etc.)
   - Global error handler middleware (`src/core/middleware/errorHandler.js`)

4. **Logging Infrastructure**

   - Winston logger configuration (`src/core/config/logger.js`)
   - Request logger middleware (`src/core/middleware/requestLogger.js`)

5. **Utility Functions**
   - JWT helpers (`src/core/utils/jwt.js`)
   - Password utilities (`src/core/utils/password.js`)
   - Response formatter (`src/core/utils/response.js`)

**Deliverables:**

- ✅ Full file implementations (not pseudo-code)
- ✅ package.json with all dependencies
- ✅ docker-compose.yml for PostgreSQL + Redis
- ✅ .env.example with all required variables
- ✅ README.md with setup instructions

---

### Phase 2: Authentication Module

**Generate complete auth module with:**

1. **Domain Layer**

   - RefreshToken entity (`src/modules/auth/domain/entities/RefreshToken.js`)
   - Email value object (`src/modules/auth/domain/value-objects/Email.js`)
   - Password value object (`src/modules/auth/domain/value-objects/Password.js`)
   - Repository interface (`src/modules/auth/domain/repositories/IRefreshTokenRepository.js`)
   - Domain events (UserLoggedIn, UserRegistered)

2. **Application Layer**

   - RegisterUser use case (with email validation)
   - LoginUser use case (with password verification)
   - RefreshToken use case (token rotation)
   - ForgotPassword use case (send reset email)
   - ResetPassword use case (update password)
   - TokenService (JWT generation/validation)
   - PasswordService (bcrypt operations)
   - EmailService (send emails)

3. **Infrastructure Layer**

   - Sequelize RefreshToken model
   - SequelizeRefreshTokenRepository implementation
   - Database migration for refresh_tokens table

4. **Presentation Layer**

   - AuthController (HTTP handlers)
   - Auth routes (POST /auth/register, /auth/login, etc.)
   - authenticate middleware (JWT verification)
   - requireAuth middleware (protect routes)
   - Input validators (Joi/Zod schemas)

5. **Tests**
   - Unit tests for all use cases
   - Integration tests for all endpoints
   - Test fixtures

**API Endpoints:**

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/verify-email
```

---

### Phase 3: User Module

**Generate complete user management with:**

- User entity (aggregate root)
- CRUD use cases
- User search functionality
- Profile update logic
- User status management (active/inactive/banned)
- Avatar upload (optional)

**API Endpoints:**

```
GET    /api/v1/users/me
PUT    /api/v1/users/me
GET    /api/v1/users
GET    /api/v1/users/:id
DELETE /api/v1/users/:id
GET    /api/v1/users/search?q=...
```

---

### Phase 4: Workspace Module (Multi-Tenancy)

**Generate workspace with:**

- Workspace entity (tenant container)
- WorkspaceMember entity (join table)
- Invitation entity (email invitations)
- CreateWorkspace use case
- InviteMember use case (send email)
- AcceptInvitation use case
- RemoveMember use case
- tenantContext middleware (inject workspace into req)
- requireWorkspace middleware (enforce workspace access)

**API Endpoints:**

```
POST   /api/v1/workspaces
GET    /api/v1/workspaces
GET    /api/v1/workspaces/:id
PUT    /api/v1/workspaces/:id
DELETE /api/v1/workspaces/:id
POST   /api/v1/workspaces/:id/members/invite
POST   /api/v1/workspaces/:id/members/accept
DELETE /api/v1/workspaces/:id/members/:userId
POST   /api/v1/workspaces/:id/switch
```

---

### Phase 5: Role & Permission Module (RBAC)

**Generate RBAC system with:**

- Role entity (admin, member, viewer)
- Permission entity (users.create, users.delete, etc.)
- RolePermission join table
- UserRole join table
- CreateRole use case
- AssignPermission use case
- AssignRoleToUser use case
- CheckPermission use case
- requirePermission middleware (e.g., `requirePermission('users.delete')`)

**Permission Naming Convention:**

```
resource.action
- users.create
- users.read
- users.update
- users.delete
- workspaces.manage
- roles.assign
```

---

### Phase 6: Socket.IO Integration

**Generate real-time system with:**

- SocketManager class (connection management)
- SocketAuth middleware (JWT authentication)
- Room management (workspace rooms)
- Event broadcasting
- Domain event → Socket event mapping

**Example Events:**

```javascript
// Server emits
socket.emit("workspace:member:joined", { userId, workspaceId });
socket.emit("notification:new", { notificationId, message });

// Client listens
socket.on("workspace:member:joined", (data) => {
  /* update UI */
});
```

---

## 📦 Environment Variables Template

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1
API_PREFIX=/api

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_dev
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_SSL=false

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key
REFRESH_TOKEN_EXPIRES_IN=7d

# Email Service (SendGrid/AWS SES/Mailgun)
EMAIL_SERVICE=sendgrid
EMAIL_FROM=noreply@myapp.com
EMAIL_FROM_NAME=MyApp
SENDGRID_API_KEY=your-sendgrid-api-key
# or for AWS SES
# AWS_SES_REGION=us-east-1
# AWS_SES_ACCESS_KEY=...
# AWS_SES_SECRET_KEY=...

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# Socket.IO
SOCKET_CORS_ORIGIN=http://localhost:3000
SOCKET_PORT=3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload (AWS S3)
AWS_S3_BUCKET=myapp-uploads
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY=...
AWS_S3_SECRET_KEY=...

# Monitoring (optional)
SENTRY_DSN=
NEW_RELIC_LICENSE_KEY=

# Logging
LOG_LEVEL=debug
```

---

## 🐳 Docker Configuration

### docker-compose.yml

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: myapp_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: myapp_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - myapp_network

  redis:
    image: redis:7-alpine
    container_name: myapp_redis
    ports:
      - "6379:6379"
    networks:
      - myapp_network

  api:
    build: .
    container_name: myapp_api
    environment:
      NODE_ENV: development
      DB_HOST: postgres
      REDIS_HOST: redis
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    networks:
      - myapp_network

volumes:
  postgres_data:

networks:
  myapp_network:
    driver: bridge
```

---

## ✅ Code Quality Requirements

### Must Include

1. **ESLint Configuration** (Airbnb style guide)
2. **Prettier Configuration** (consistent formatting)
3. **Husky Pre-commit Hooks** (lint + test before commit)
4. **Jest Configuration** (with coverage thresholds)
5. **OpenAPI/Swagger Documentation** (auto-generated from routes)

### Code Standards

- **No Business Logic in Controllers** - Controllers only handle HTTP concerns
- **No Direct Database Access in Use Cases** - Use repositories
- **No Framework Dependencies in Domain** - Pure business logic
- **Error Handling Everywhere** - Try/catch in all async functions
- **Input Validation** - Validate ALL user inputs
- **TypeScript-Ready** - JSDoc comments for better IDE support

---

## 🎯 Success Criteria

This API is production-ready when:

- ✅ All tests pass with ≥80% coverage
- ✅ All endpoints are documented (OpenAPI)
- ✅ Docker containers start successfully
- ✅ Database migrations run without errors
- ✅ Authentication flow works end-to-end
- ✅ Multi-tenancy enforces workspace isolation
- ✅ RBAC prevents unauthorized access
- ✅ Real-time events broadcast correctly
- ✅ API handles 1000+ req/sec under load
- ✅ No sensitive data in logs or responses
- ✅ CI/CD pipeline runs successfully

---

## 🚀 Implementation Strategy

### For AI Assistant: Generate Code in This Order

**Step 1: Foundation (Phase 1)**

```
Generate ALL files for:
1. Core server setup
2. Database configuration
3. Error handling system
4. Logging infrastructure
5. Utility functions
6. Docker configuration
7. Package.json with dependencies
```

**Step 2: Authentication (Phase 2)**

```
Generate COMPLETE auth module:
1. All domain entities and value objects
2. All use cases with business logic
3. Repository implementations
4. Controllers and routes
5. Middleware (authenticate, requireAuth)
6. Input validators
7. Database migrations
8. Unit and integration tests
```

**Step 3: Core Modules (Phases 3-5)**

```
Generate in order:
1. User module (complete)
2. Workspace module (complete)
3. Role & Permission module (complete)
Each with full domain/application/infrastructure/presentation layers
```

**Step 4: Real-Time (Phase 6)**

```
Generate Socket.IO integration:
1. SocketManager class
2. Authentication middleware
3. Event broadcasting logic
4. Domain event handlers
```

---

## 📝 Final Deliverables

### Required Files (Minimum)

- [ ] package.json (with all dependencies)
- [ ] docker-compose.yml
- [ ] .env.example
- [ ] src/server.js
- [ ] All core infrastructure files
- [ ] Complete auth module (all layers)
- [ ] Database migrations
- [ ] API documentation (README or Swagger)
- [ ] Test examples

### Documentation

- [ ] README.md with setup instructions
- [ ] API endpoint documentation
- [ ] Architecture decision records (ADRs)
- [ ] Database schema diagrams
- [ ] Environment variable descriptions

---

## 🎬 Start Implementation

**AI Assistant: Begin with Phase 1 (Core Infrastructure)**

Generate complete, runnable code for:

1. Express server setup
2. Sequelize database configuration
3. Error handling system
4. Winston logger
5. JWT and password utilities
6. Docker configuration
7. Package.json with all dependencies

**Make it production-ready, not a tutorial. Every file should be copy-paste ready.**

---

## 💡 Additional Features (Optional)

After core implementation, consider adding:

- [ ] **GraphQL API** (Apollo Server)
- [ ] **Microservices** (Message queue with RabbitMQ/Kafka)
- [ ] **Caching Strategy** (Redis caching layer)
- [ ] **File Upload** (AWS S3 integration)
- [ ] **Notification System** (Email + Push + In-app)
- [ ] **Audit Logging** (Track all data changes)
- [ ] **API Versioning** (/api/v1, /api/v2)
- [ ] **Search** (Elasticsearch integration)
- [ ] **Background Jobs** (Bull queue + Redis)
- [ ] **Monitoring** (Prometheus + Grafana)
