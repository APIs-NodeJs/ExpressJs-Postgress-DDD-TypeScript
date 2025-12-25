# Devcycle API - Complete Technical Documentation

**Version:** 1.0.0  
**Last Updated:** December 2025  
**Architecture:** Clean Architecture with Domain-Driven Design (DDD)  
**Stack:** Node.js + TypeScript + Express + PostgreSQL

---

## Table of Contents

1.  [Executive Summary](#executive-summary)
2.  [API Architecture](#api-architecture)
3.  [Technology Stack & Dependencies](#technology-stack--dependencies)
4.  [Request-Response Flow](#request-response-flow)
5.  [Security](#security)
6.  [Performance & Scalability](#performance--scalability)
7.  [Error Handling Strategy](#error-handling-strategy)
8.  [Success Response Patterns](#success-response-patterns)
9.  [Runtime Scenarios](#runtime-scenarios)
10. [Development Guidelines](#development-guidelines)
11. [Deployment & Operations](#deployment--operations)

---

## 1. Executive Summary

### 1.1 Purpose

Devcycle API is an enterprise-grade authentication and workspace management system built with maintainability, security, and scalability as primary concerns. The architecture enables:

- **Long-term maintainability** through clear separation of concerns
- **High testability** with isolated business logic
- **Framework independence** allowing easy migration or replacement
- **Scalable design** supporting horizontal and vertical scaling

### 1.2 Core Capabilities

- User authentication with JWT tokens
- Workspace management (multi-tenancy)
- Role-based access control (Owner, Admin, User)
- Permission-based authorization
- Email verification and password reset
- Two-factor authentication (2FA)
- Comprehensive audit logging
- API metrics and monitoring

### 1.3 Design Philosophy

The API follows **Clean Architecture** principles combined with **Domain-Driven Design (DDD)**, ensuring:

1. **Business logic remains pure** - No framework dependencies in domain layer
2. **Testability** - Each layer can be tested independently
3. **Flexibility** - Easy to swap implementations (databases, frameworks)
4. **Maintainability** - Clear responsibilities and boundaries

---

## 2. API Architecture

### 2.1 Architectural Pattern

The application implements **Clean Architecture** (also known as Onion Architecture) with four distinct layers:

```
┌─────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                    │
│  (Express, Sequelize, JWT, Bcrypt, Winston)             │
│  • HTTP Server & Routes                                 │
│  • Database Models & Connections                        │
│  • External Services (Email, Sentry, Redis)             │
│  • Security Implementations                             │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────┴─────────────────────────────────────┐
│              Presentation Layer                         │
│  (Controllers, Routes, Middlewares, DTOs)               │
│  • Request/Response Handling                            │
│  • Input Validation (Zod)                               │
│  • Authentication & Authorization                       │
│  • Error Transformation                                 │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────┴─────────────────────────────────────┐
│              Application Layer                          │
│  (Use Cases, Business Orchestration)                    │
│  • SignUpUseCase, LoginUseCase                          │
│  • Business Workflow Coordination                       │
│  • Transaction Management                               │
│  • Result Pattern for Error Handling                    │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────┴─────────────────────────────────────┐
│                 Domain Layer                            │
│  (Entities, Value Objects, Domain Logic)                │
│  • User, Workspace Entities                             │
│  • Business Rules & Invariants                          │
│  • Repository Interfaces                                │
│  • Domain Services (IPasswordHasher, ITokenService)     │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Dependency Rule

**Critical Principle:** Dependencies only flow inward. Outer layers depend on inner layers, never the reverse.

```
Infrastructure → Presentation → Application → Domain
        ✓              ✓             ✓          ✗
```

This ensures:

- Domain layer has ZERO external dependencies
- Business logic is framework-agnostic
- Easy to test with mocks
- Changes in infrastructure don't affect business logic

### 2.3 Folder Structure

```
src/
├── config/                          # Configuration files
│   ├── constants.ts                # Application constants
│   ├── database.ts                 # Database configuration & connection
│   └── env.ts                      # Environment validation (Zod)
│
├── infrastructure/                  # 🔷 Infrastructure Layer
│   ├── cache/                      # Redis caching
│   │   ├── CacheService.ts
│   │   └── RedisClient.ts
│   ├── database/
│   │   └── models/                 # Sequelize ORM models
│   │       ├── UserModel.ts
│   │       └── WorkspaceModel.ts
│   ├── di/                         # Dependency Injection (tsyringe)
│   │   ├── container.ts
│   │   └── tokens.ts
│   ├── documentation/
│   │   └── swagger.ts              # OpenAPI/Swagger setup
│   ├── http/
│   │   ├── middlewares/            # Express middlewares
│   │   │   ├── authenticate.ts     # JWT verification
│   │   │   ├── authorize.ts        # RBAC/permissions
│   │   │   ├── errorHandler.ts     # Global error handling
│   │   │   ├── requestLogger.ts    # Request logging
│   │   │   ├── sanitizeInput.ts    # XSS prevention
│   │   │   └── validate.ts         # Zod validation
│   │   └── routes/
│   │       ├── index.ts            # Main router
│   │       └── metricsRoutes.ts    # Metrics endpoints
│   ├── monitoring/
│   │   ├── MetricsCollector.ts     # Performance metrics
│   │   └── sentry.ts               # Error tracking (Sentry)
│   ├── pagination/
│   │   └── Paginator.ts            # Pagination utility
│   └── AuditLogger.ts              # Audit trail system
│
├── modules/                         # Feature modules
│   └── auth/                       # Authentication module
│       ├── application/             # 🟢 Application Layer
│       │   └── use-cases/
│       │       ├── SignUpUseCase.ts
│       │       ├── LoginUseCase.ts
│       │       ├── GetCurrentUserUseCase.ts
│       │       ├── RefreshTokenUseCase.ts
│       │       ├── ForgotPasswordUseCase.ts
│       │       ├── ResetPasswordUseCase.ts
│       │       ├── VerifyEmailUseCase.ts
│       │       ├── Enable2FAUseCase.ts
│       │       └── Verify2FAUseCase.ts
│       │
│       ├── domain/                  # 🔴 Domain Layer (Core)
│       │   ├── entities/
│       │   │   ├── User.ts         # User entity with business rules
│       │   │   └── Workspace.ts
│       │   ├── repositories/       # Repository interfaces (contracts)
│       │   │   ├── IUserRepository.ts
│       │   │   └── IWorkspaceRepository.ts
│       │   ├── services/           # Domain service interfaces
│       │   │   ├── IPasswordHasher.ts
│       │   │   └── ITokenService.ts
│       │   └── value-objects/
│       │       └── Permission.ts   # RBAC permissions
│       │
│       ├── infrastructure/          # 🔷 Infrastructure implementations
│       │   ├── repositories/
│       │   │   ├── UserRepository.ts
│       │   │   └── WorkspaceRepository.ts
│       │   ├── security/
│       │   │   ├── PasswordHasher.ts    # Bcrypt implementation
│       │   │   └── TokenService.ts      # JWT implementation
│       │   └── validators/
│       │       └── authValidators.ts    # Zod schemas
│       │
│       └── presentation/            # 🟡 Presentation Layer
│           ├── controllers/
│           │   └── AuthController.ts
│           └── routes/
│               └── authRoutes.ts
│
├── shared/                          # Shared utilities
│   ├── application/
│   │   ├── Result.ts               # Result pattern (Success/Failure)
│   │   └── UseCase.ts              # Use case base interface
│   ├── domain/
│   │   └── AppError.ts             # Custom error class
│   └── infrastructure/
│       ├── email/                  # Email service abstraction
│       │   ├── IEmailService.ts
│       │   └── MockEmailService.ts
│       └── logger/
│           └── logger.ts           # Winston logger wrapper
│
├── app.ts                          # Express app setup
└── server.ts                       # Server entry point
```

### 2.4 Why This Architecture?

#### ✅ **Advantages**

1. **Testability**
   - Domain logic can be tested without database or HTTP
   - Mock implementations for all interfaces
   - 50%+ code coverage achieved easily

2. **Maintainability**
   - Changes in one layer don't cascade to others
   - Clear responsibility boundaries
   - Easy to onboard new developers

3. **Flexibility**
   - Swap Express for Fastify without touching business logic
   - Change from PostgreSQL to MongoDB by implementing repository
   - Replace JWT with OAuth without changing use cases

4. **Scalability**
   - Horizontal scaling: stateless design
   - Vertical scaling: efficient resource usage
   - Microservices ready: each module can become a service

#### ⚠️ **Trade-offs**

1. **Initial Complexity**
   - More files and folders than simple MVC
   - Requires understanding of architectural patterns
   - **Mitigation:** Comprehensive documentation and examples

2. **Boilerplate Code**
   - Interfaces and implementations for everything
   - Multiple layers for simple operations
   - **Mitigation:** Code generation tools and templates

3. **Over-engineering Risk**
   - Can be overkill for small projects
   - **Mitigation:** Start simple, evolve as needed

---

## 3. Technology Stack & Dependencies

### 3.1 Core Technologies

#### **Runtime & Language**

| Technology     | Version | Purpose            | Why Chosen                                                                                                        |
| -------------- | ------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **Node.js**    | 18+     | JavaScript runtime | - Excellent async I/O performance<br>- Large ecosystem<br>- Fast development cycles<br>- Strong community support |
| **TypeScript** | 5.9+    | Static typing      | - Catch errors at compile time<br>- Better IDE support<br>- Self-documenting code<br>- Easier refactoring         |

#### **Web Framework**

| Technology  | Version | Purpose     | Why Chosen                                                                                                                 |
| ----------- | ------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Express** | 4.22+   | HTTP server | - Minimal and unopinionated<br>- Mature and stable<br>- Extensive middleware ecosystem<br>- Perfect for Clean Architecture |

**Why Express over NestJS/Fastify?**

- **Control:** Clean Architecture requires full control over dependencies
- **Simplicity:** No magic, explicit wiring
- **Learning:** Teaches fundamentals
- **Performance:** Lightweight, 5-10k req/s capable

### 3.2 Database Layer

| Technology     | Version | Purpose          | Why Chosen                                                                                                               |
| -------------- | ------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **PostgreSQL** | 15+     | Primary database | - ACID compliance<br>- Excellent for relational data<br>- Advanced features (JSONB, CTEs)<br>- Battle-tested reliability |
| **Sequelize**  | 6.35+   | ORM              | - TypeScript support<br>- Migration management<br>- Connection pooling<br>- Query builder                                |

**Connection Pool Configuration:**

```typescript
pool: {
  max: 20,           // Maximum connections
  min: 5,            // Minimum connections
  acquire: 60000,    // Max time to get connection (60s)
  idle: 10000,       // Max idle time (10s)
  evict: 1000        // Eviction check interval (1s)
}
```

**Why PostgreSQL?**

- Strong consistency guarantees
- Foreign key constraints
- Advanced indexing (B-tree, GiST, GIN)
- JSON support (JSONB) for flexibility

### 3.3 Security Dependencies

| Package                | Version | Purpose          | Why Chosen                                                                                       |
| ---------------------- | ------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| **bcrypt**             | 5.1.1   | Password hashing | - Industry standard<br>- Adjustable cost factor<br>- Resistant to rainbow tables                 |
| **jsonwebtoken**       | 9.0.2   | JWT tokens       | - Stateless authentication<br>- Standard compliant<br>- Flexible payload                         |
| **helmet**             | 7.2.0   | Security headers | - XSS protection<br>- HSTS enforcement<br>- Content Security Policy<br>- Clickjacking prevention |
| **cors**               | 2.8.5   | CORS handling    | - Whitelist origins<br>- Credentials support<br>- Preflight handling                             |
| **express-rate-limit** | 7.5.1   | Rate limiting    | - DDoS protection<br>- Brute force prevention<br>- Per-route limits                              |
| **speakeasy**          | 2.0.0   | TOTP/2FA         | - Time-based OTP<br>- Compatible with Google Authenticator<br>- Backup codes support             |

**Security Configuration:**

```typescript
// Password hashing - 12 rounds (2^12 = 4096 iterations)
BCRYPT_ROUNDS=12  // Balance between security and performance

// JWT expiration
JWT_ACCESS_EXPIRES_IN=15m   // Short-lived for security
JWT_REFRESH_EXPIRES_IN=7d    // Long-lived for UX

// Rate limiting
RATE_LIMIT_MAX_REQUESTS=100        // 100 requests per minute (global)
AUTH_RATE_LIMIT_MAX_REQUESTS=5     // 5 auth attempts per 15 minutes
```

### 3.4 Validation & Type Safety

| Package | Version | Purpose            | Why Chosen                                                                                   |
| ------- | ------- | ------------------ | -------------------------------------------------------------------------------------------- |
| **zod** | 3.25+   | Runtime validation | - TypeScript-first<br>- Type inference<br>- Composable schemas<br>- Excellent error messages |

**Example Validation:**

```typescript
const signupSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/\d/, "Must contain number")
    .regex(/[!@#$%^&*]/, "Must contain special char"),
  name: z.string().min(2).max(100).trim(),
  workspaceName: z.string().min(2).max(100).trim(),
});
```

**Why Zod over Joi/Yup?**

- TypeScript-native (types inferred automatically)
- Better error messages
- Smaller bundle size
- Active development

### 3.5 Logging & Monitoring

| Package          | Version | Purpose            | Why Chosen                                                                             |
| ---------------- | ------- | ------------------ | -------------------------------------------------------------------------------------- |
| **winston**      | 3.19.0  | Structured logging | - Multiple transports<br>- Log levels<br>- JSON formatting<br>- Production-ready       |
| **@sentry/node** | 7.120.4 | Error tracking     | - Real-time alerts<br>- Stack traces<br>- Release tracking<br>- Performance monitoring |

**Logging Levels:**

```typescript
{
  error: 0,   // Critical errors requiring immediate attention
  warn: 1,    // Warning conditions (rate limits, deprecated APIs)
  info: 2,    // General informational messages
  debug: 3    // Detailed debug information (dev only)
}
```

### 3.6 Dependency Injection

| Package      | Version | Purpose      | Why Chosen                                                                                  |
| ------------ | ------- | ------------ | ------------------------------------------------------------------------------------------- |
| **tsyringe** | 4.10.0  | DI container | - Decorator-based<br>- TypeScript support<br>- Lightweight<br>- Clean Architecture friendly |

**Why DI?**

- Loose coupling
- Easier testing (mock injection)
- Single Responsibility Principle
- Explicit dependencies

### 3.7 Caching (Optional)

| Package   | Version | Purpose         | Why Chosen                                                                       |
| --------- | ------- | --------------- | -------------------------------------------------------------------------------- |
| **redis** | 4.7.1   | Session caching | - In-memory speed<br>- Pub/sub support<br>- Distributed caching<br>- TTL support |

**Cache Strategy:**

- User sessions: 15 minutes
- Frequently accessed data: 1 hour
- Invalidate on updates

### 3.8 Documentation

| Package                | Version | Purpose             | Why Chosen                                                      |
| ---------------------- | ------- | ------------------- | --------------------------------------------------------------- |
| **swagger-jsdoc**      | 6.2.8   | API docs generation | - OpenAPI 3.0<br>- Code-driven docs<br>- Interactive UI         |
| **swagger-ui-express** | 5.0.1   | API docs UI         | - Try-it-out feature<br>- Schema validation<br>- Auto-generated |

### 3.9 Development Dependencies

| Package       | Purpose                            |
| ------------- | ---------------------------------- |
| **jest**      | Unit & integration testing         |
| **supertest** | HTTP endpoint testing              |
| **ts-jest**   | TypeScript support for Jest        |
| **tsx**       | Development server with hot reload |
| **eslint**    | Code linting                       |
| **prettier**  | Code formatting                    |
| **artillery** | Load testing                       |

### 3.10 Dependency Strategy

**Principles:**

1. **Minimal dependencies** - Only add when truly needed
2. **Well-maintained** - Active development, security patches
3. **Type-safe** - TypeScript definitions available
4. **Battle-tested** - Used by major companies
5. **License-friendly** - MIT/Apache preferred

**Security:**

- Weekly `npm audit` checks
- Automated Dependabot updates
- Lock file committed (`package-lock.json`)
- Production-only dependencies in Docker

---

## 4. Request-Response Flow

### 4.1 Complete Request Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  1. CLIENT REQUEST                                          │
│     POST /api/v1/auth/login                                 │
│     Content-Type: application/json                          │
│     { email, password }                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  2. EXPRESS MIDDLEWARE CHAIN (app.ts)                       │
├─────────────────────────────────────────────────────────────┤
│  ✓ Sentry Request Handler        (Error tracking)           │
│  ✓ Helmet                         (Security headers)        │
│  ✓ CORS                           (Origin validation)       │
│  ✓ Rate Limiter (Global)          (100 req/min)             │
│  ✓ Body Parser                    (JSON parsing)            │
│  ✓ Request ID                     (UUID generation)         │
│  ✓ Metrics Middleware             (Performance tracking)    │
│  ✓ Request Logger                 (Winston logging)         │
│  ✓ Sanitize Input                 (XSS prevention)          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3. ROUTE MATCHING (authRoutes.ts)                          │
├─────────────────────────────────────────────────────────────┤
│  POST /api/v1/auth/login → authRoutes                       │
│                                                             │
│  Route-specific middleware:                                 │
│  ✓ Auth Rate Limiter              (5 req/15 min)            │
│  ✓ Zod Validation                 (loginSchema)             │
│  ✓ Async Handler                  (Error catching)          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  4. CONTROLLER (AuthController.ts)                          │
├─────────────────────────────────────────────────────────────┤
│  login(req, res, next) {                                    │
│    1. Extract validated data from req.body                  │
│    2. Call LoginUseCase.execute()                           │
│    3. Handle Result<T>:                                     │
│       - Success: res.status(200).json({ data })             │
│       - Failure: throw AppError                             │
│  }                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  5. USE CASE (LoginUseCase.ts)                              │
├─────────────────────────────────────────────────────────────┤
│  execute({ email, password }) {                             │
│    1. Find user via UserRepository                          │
│    2. Verify password with PasswordHasher                   │
│    3. Generate tokens with TokenService                     │
│    4. Return Result.ok({ user, tokens })                    │
│       or Result.fail("error message")                       │
│  }                                                          │
│                                                             │
│  Dependencies injected:                                     │
│  - IUserRepository (interface)                              │
│  - IPasswordHasher (interface)                              │
│  - ITokenService (interface)                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  6. REPOSITORY (UserRepository.ts)                          │
├─────────────────────────────────────────────────────────────┤
│  findByEmail(email: string): Promise<User | null> {         │
│    1. Query UserModel (Sequelize)                           │
│    2. Map model → Domain entity                             │
│    3. Return User entity                                    │
│  }                                                          │
│                                                             │
│  Handles:                                                   │
│  - ORM interactions                                         │
│  - Data transformation (Model ↔ Entity)                     │
│  - Query optimization                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  7. DATABASE (PostgreSQL)                                   │
├─────────────────────────────────────────────────────────────┤
│  SELECT * FROM users WHERE email = $1                       │
│                                                             │
│  Connection Pool:                                           │
│  - Reuses connections                                       │
│  - Max 20 concurrent                                        │
│  - Auto-retry on failure                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼ (Data flows back up)
┌─────────────────────────────────────────────────────────────┐
│  8. RESPONSE TRANSFORMATION                                 │
├─────────────────────────────────────────────────────────────┤
│  {                                                          │
│    "data": {                                                │
│      "user": {                                              │
│        "id": "uuid",                                        │
│        "email": "user@example.com",                         │
│        "name": "John Doe",                                  │
│        "role": "owner"                                      │
│      },                                                     │
│      "tokens": {                                            │
│        "accessToken": "jwt...",                             │
│        "refreshToken": "jwt...",                            │
│        "expiresIn": 900                                     │
│      }                                                      │
│    }                                                        │
│  }                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  9. LOGGING & METRICS                                       │
├─────────────────────────────────────────────────────────────┤
│  Winston Logger:                                            │
│  - Request ID, method, URL, duration, status                │
│  - User ID (if authenticated)                               │
│                                                             │
│  Metrics Collector:                                         │
│  - Total requests++                                         │
│  - Response time recorded                                   │
│  - Error count (if applicable)                              │
│                                                             │
│  Sentry (if error):                                         │
│  - Stack trace                                              │
│  - User context                                             │
│  - Request details                                          │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Authentication Flow

#### **Protected Endpoint Request**

```
Client Request
     │
     ├─→ Authorization: Bearer <access_token>
     │
     ▼
authenticate middleware
     │
     ├─→ Extract token from header
     ├─→ Verify with JWT_ACCESS_SECRET
     ├─→ Decode payload: { userId, workspaceId, email, role }
     ├─→ Attach to req.user
     │
     ▼
authorize middleware (if needed)
     │
     ├─→ Check req.user.role
     ├─→ Verify permissions
     ├─→ Allow/Deny access
     │
     ▼
Controller → Use Case → Repository
```

### 4.3 Error Flow

```
Error occurs anywhere
     │
     ▼
asyncHandler catches Promise rejection
     │
     ▼
errorHandler middleware
     │
     ├─→ Is AppError (operational)?
     │   ├─→ YES: Log at WARN level
     │   │        Return structured error
     │   │
     │   └─→ NO:  Log at ERROR level with stack trace
     │            Send to Sentry
     │            Return generic 500 error
     │
     ▼
Sentry Error Handler (optional)
     │
     ▼
Client receives structured error response
```

### 4.4 Transaction Flow (Signup)

```
SignUpUseCase.execute()
     │
     ▼
withTransaction(async (transaction) => {
     │
     ├─→ 1. Hash password (PasswordHasher)
     │
     ├─→ 2. Create Workspace (WorkspaceRepository)
     │      - INSERT INTO workspaces (transaction)
     │
     ├─→ 3. Create User (UserRepository)
     │      - INSERT INTO users (transaction)
     │
     ├─→ 4. Update Workspace.ownerId (WorkspaceRepository)
     │      - UPDATE workspaces (transaction)
     │
     ├─→ ✓ Commit transaction
     │   All changes saved atomically
     │
     ├─→ ✗ Rollback on any error
     │   No partial state
     │
     └─→ Generate tokens
})
```

### 4.5 Caching Flow (with Redis)

```
Request → Cache Check
     │
     ├─→ Cache HIT
     │   └─→ Return cached data (fast path)
     │
     └─→ Cache MISS
         │
         ├─→ Query database
         ├─→ Transform data
         ├─→ Store in cache (TTL)
         └─→ Return fresh data
```

---

## 5. Security

### 5.1 Authentication Architecture

#### **JWT Token Strategy**

**Two-token system:**

1. **Access Token** (short-lived: 15 minutes)
   - Used for API requests
   - Minimal payload for speed
   - Cannot be revoked (stateless)

2. **Refresh Token** (long-lived: 7 days)
   - Used to obtain new access tokens
   - Longer expiration for UX
   - Can be revoked via database

**Token Payload:**

```typescript
{
  userId: string,
  workspaceId: string,
  email: string,
  role: "owner" | "admin" | "user",
  type: "access" | "refresh",
  iat: number,  // Issued at
  exp: number,  // Expiration
  iss: "devcycle-api",
  aud: "devcycle-client"
}
```

**Why This Approach?**

- **Security:** Short access token limits exposure
- **UX:** Refresh token avoids constant re-login
- **Performance:** Stateless verification (no database lookup)
- **Scalability:** Works across multiple servers

#### **Token Refresh Flow**

```
1. Client detects expired access token (401)
2. Client sends refresh token to /api/v1/auth/refresh
3. Server verifies refresh token
4. Server generates new token pair
5. Server returns new tokens
6. Client retries original request
```

### 5.2 Password Security

#### **Hashing Algorithm**

```typescript
// Bcrypt with cost factor 12
const hash = await bcrypt.hash(password, 12);
// ~250ms on modern CPU
// 2^12 = 4,096 iterations
```

**Why Bcrypt?**

- Adaptive: can increase cost as hardware improves
- Salted: prevents rainbow table attacks
- Slow by design: defeats brute force
- Industry standard

**Password Requirements:**

```typescript
{
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,    // [A-Z]
  requireLowercase: true,    // [a-z]
  requireNumber: true,       // [0-9]
  requireSpecial: true,      // [!@#$%^&*(),.?":{}|<>]
  noWhitespace: true
}
```

**Validation Example:**

```typescript
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[a-z]/, "Must contain lowercase letter")
  .regex(/\d/, "Must contain number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain special character")
  .refine((val) => !/\s/.test(val), "Must not contain whitespace");
```

### 5.3 Rate Limiting

#### **Global Rate Limit**

```typescript
{
  windowMs: 60000,      // 1 minute
  max: 100,             // 100 requests per minute
  standardHeaders: true,
  message: "Too many requests, please try again later"
}
```

**Purpose:** Prevents DDoS attacks and abuse

#### **Authentication Rate Limit**

```typescript
{
  windowMs: 900000,     // 15 minutes
  max: 5,               // 5 attempts per 15 minutes
  message: "Too many authentication attempts"
}
```

**Purpose:** Prevents brute force password attacks

#### **Strategy**

| Endpoint      | Limit   | Window | Reason                   |
| ------------- | ------- | ------ | ------------------------ |
| Global        | 100 req | 1 min  | General abuse prevention |
| /auth/login   | 5 req   | 15 min | Brute force protection   |
| /auth/signup  | 5 req   | 15 min | Spam account prevention  |
| /auth/refresh | 10 req  | 15 min | Token abuse prevention   |

**Implementation:**

```typescript
// Apply to specific route
router.post(
  "/login",
  authLimiter, // Rate limit first
  validate(schema), // Then validate
  asyncHandler(controller.login)
);
```

### 5.4 Input Validation & Sanitization

#### **Validation Strategy**

**Layer 1: Type Validation (Zod)**

```typescript
const signupSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: passwordSchema,
  name: z.string().min(2).max(100).trim(),
  workspaceName: z.string().min(2).max(100).trim(),
});
```

**Layer 2: Sanitization (XSS Prevention)**

```typescript
function sanitizeValue(value: string): string {
  return value
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}
```

**Why Two Layers?**

- Zod ensures correct format
- Sanitization prevents XSS even if validation bypassed
- Defense in depth

#### **SQL Injection Prevention**

**Sequelize ORM with parameterized queries:**

```typescript
// ✅ SAFE - Parameterized
await UserModel.findOne({
  where: { email: userInput },
});

// ❌ UNSAFE - String interpolation
await sequelize.query(`SELECT * FROM users WHERE email = '${userInput}'`);
```

**All queries use parameterized statements automatically.**

### 5.5 Security Headers (Helmet)

```typescript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: "deny" }, // Prevent clickjacking
  noSniff: true, // Prevent MIME sniffing
  xssFilter: true, // XSS protection
});
```

**Headers Applied:**

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

### 5.6 CORS Configuration

```typescript
cors({
  origin: (origin, callback) => {
    const allowedOrigins = env.ALLOWED_ORIGINS; // From .env

    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    // Check whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      Logger.security("CORS violation", { origin });
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Request-ID"],
  maxAge: 86400, // 24 hours
});
```

**Production Setup:**

```env
ALLOWED_ORIGINS=https://app.devcycle.com,https://admin.devcycle.com
```

### 5.7 Two-Factor Authentication (2FA)

#### **TOTP-based 2FA**

**Setup Flow:**

```
1. User enables 2FA
2. Server generates secret key
3. Server creates QR code with otpauth URL
4. User scans QR with authenticator app
5. User enters 6-digit code to verify
6. Server validates and enables 2FA
7. Server generates backup codes
```

**Login Flow with 2FA:**

```
1. User enters email + password
2. Server verifies credentials
3. If 2FA enabled:
   a. Prompt for 6-digit code
   b. Verify TOTP token
   c. Issue access tokens
4. If 2FA disabled:
   a. Issue access tokens immediately
```

**Implementation:**

```typescript
// Generate secret
const secret = authenticator.generateSecret();

// Generate OTP auth URL
const otpauth = authenticator.keyuri(user.email, "Devcycle API", secret);

// Generate QR code
const qrCode = await QRCode.toDataURL(otpauth);

// Verify token
const verified = speakeasy.totp.verify({
  secret: user.twoFactorSecret,
  encoding: "base32",
  token: userProvidedCode,
  window: 2, // Allow 60s clock drift
});
```

**Backup Codes:**

- 10 single-use codes generated
- Hashed (SHA-256) before storage
- User must save securely
- Used when authenticator unavailable

### 5.8 Audit Logging

**What We Log:**

- All authentication events (login, logout, failed attempts)
- Permission changes
- Sensitive data access
- Password resets
- 2FA changes
- User invitations/removals

**Audit Log Structure:**

```typescript
{
  id: UUID,
  userId: UUID | null,
  workspaceId: UUID,
  action: string,              // "USER_LOGIN", "PASSWORD_RESET"
  resourceType: string,        // "user", "workspace"
  resourceId: UUID | null,
  ipAddress: string,
  userAgent: string,
  metadata: JSONB,            // Additional context
  createdAt: timestamp
}
```

**Example:**

```typescript
await AuditLogger.log({
  userId: req.user.userId,
  workspaceId: req.user.workspaceId,
  action: "USER_LOGIN",
  resourceType: "user",
  resourceId: req.user.userId,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
  metadata: {
    success: true,
    twoFactorUsed: true,
  },
});
```

### 5.9 Environment Variable Security

**Never commit sensitive data:**

```bash
# ✅ .env (gitignored)
JWT_ACCESS_SECRET=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
DB_PASSWORD=strongDatabasePassword123!

# ❌ Never in code
const secret = "hardcoded-secret";  // NEVER DO THIS
```

**Validation on Startup:**

```typescript
const envSchema = z
  .object({
    JWT_ACCESS_SECRET: z
      .string()
      .min(32, "JWT secret must be at least 32 characters"),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32, "JWT secret must be at least 32 characters"),
  })
  .superRefine((data, ctx) => {
    if (data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Secrets must be different",
      });
    }
  });
```

**Production Secret Management:**

- Use AWS Secrets Manager / HashiCorp Vault
- Rotate secrets regularly
- Never log secrets
- Use different secrets per environment

---

## 6. Performance & Scalability

### 6.1 Database Optimization

#### **Indexing Strategy**

```sql
-- Email lookup (most common query)
CREATE INDEX idx_users_email ON users(email);

-- Workspace queries
CREATE INDEX idx_users_workspace_id ON users(workspace_id);

-- Token lookups (for password reset, email verification)
CREATE INDEX idx_users_verification_token ON users(verification_token);
CREATE INDEX idx_users_reset_token ON users(reset_token);

-- Audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_workspace_id ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

**Index Selection Criteria:**

- Columns used in WHERE clauses
- Foreign keys
- Columns used in JOINs
- Columns used in ORDER BY

**Trade-offs:**

- ✅ Faster SELECT queries
- ❌ Slower INSERT/UPDATE (index maintenance)
- ❌ Additional storage space

#### **Connection Pooling**

```typescript
pool: {
  max: 20,        // Max connections
  min: 5,         // Min connections (always open)
  acquire: 60000, // Max time to acquire connection
  idle: 10000,    // Max idle time before release
  evict: 1000     // Check for idle connections every 1s
}
```

**Benefits:**

- Reuses connections (avoids TCP handshake)
- Limits concurrent connections
- Prevents connection exhaustion
- Auto-recovery from network issues

**Monitoring:**

```typescript
sequelize.connectionManager.pool.on("acquire", () => {
  console.log("Connection acquired");
});

sequelize.connectionManager.pool.on("release", () => {
  console.log("Connection released");
});
```

#### **Query Optimization**

**Example: Avoid N+1 Queries**

```typescript
// ❌ BAD - N+1 queries
const users = await UserModel.findAll();
for (const user of users) {
  const workspace = await WorkspaceModel.findByPk(user.workspaceId);
  // N additional queries!
}

// ✅ GOOD - Single query with JOIN
const users = await UserModel.findAll({
  include: [{ model: WorkspaceModel, as: "workspace" }],
});
```

### 6.2 Pagination

**Implementation:**

```typescript
interface PaginationOptions {
  page: number; // Current page (1-indexed)
  limit: number; // Items per page (max 100)
}

interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

**Example Request:**

```
GET /api/v1/users?page=2&limit=20
```

**Example Response:**

```json
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 157,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": true
  }
}
```

**Why Pagination?**

- Reduces memory usage
- Faster response times
- Better UX (progressive loading)
- Prevents database overload

### 6.3 Caching Strategy

#### **Redis Caching**

**Cache Layers:**

```typescript
// 1. User sessions (15 minutes)
await cacheService.set(`user:session:${userId}`, sessionData, 900);

// 2. Frequently accessed data (1 hour)
await cacheService.set(`workspace:${workspaceId}`, workspaceData, 3600);

// 3. Query results (5 minutes)
await cacheService.set(`users:workspace:${workspaceId}`, users, 300);
```

**Cache Invalidation:**

```typescript
// On update
await userRepo.update(userId, updates);
await cacheService.delete(`user:session:${userId}`);

// On delete
await userRepo.delete(userId);
await cacheService.delete(`user:session:${userId}`);
await cacheService.delete(`users:workspace:${workspaceId}`);
```

**Cache-Aside Pattern:**

```typescript
async function getUser(userId: string): Promise<User | null> {
  // 1. Check cache
  const cached = await cacheService.get(`user:${userId}`);
  if (cached) return cached;

  // 2. Query database
  const user = await userRepo.findById(userId);

  // 3. Store in cache
  if (user) {
    await cacheService.set(`user:${userId}`, user, 900);
  }

  return user;
}
```

### 6.4 Horizontal Scaling

**Stateless Design:**

- No session stored on server (JWT)
- All state in database or cache
- Any server can handle any request

**Load Balancing Setup:**

```nginx
upstream api_backend {
  least_conn;
  server api1.internal:3000;
  server api2.internal:3000;
  server api3.internal:3000;
}

server {
  listen 80;
  location / {
    proxy_pass http://api_backend;
  }
}
```

**Sticky Sessions Not Required:**

- JWT tokens work across all servers
- Shared Redis cache
- Shared PostgreSQL database

### 6.5 Performance Monitoring

#### **Metrics Collected**

```typescript
{
  totalRequests: number,        // Lifetime request count
  totalErrors: number,          // Error count
  errorRate: number,            // Percentage of requests that errored
  averageResponseTime: number,  // Milliseconds
  requestsPerSecond: number,    // Current throughput
  memoryUsage: {
    heapUsed: number,          // MB
    heapTotal: number,         // MB
    rss: number                // MB
  },
  uptime: number                // Seconds
}
```

**Endpoints:**

```
GET /metrics             (requires auth)
GET /metrics/prometheus  (for Prometheus scraping)
```

**Prometheus Format:**

```
http_requests_total{endpoint="/api/v1/auth/login"} 1543
http_request_duration_ms{endpoint="/api/v1/auth/login"} 45
```

#### **Slow Query Detection**

```typescript
sequelize.options.logging = (sql, timing) => {
  if (timing && timing > 100) {
    // Queries over 100ms
    Logger.warn("Slow query detected", {
      sql,
      duration: timing,
    });
  }
};
```

### 6.6 Load Testing Results

**Test Setup:**

- Tool: Artillery
- Duration: 3 minutes
- Phases:
  - Warm-up: 60s @ 10 req/s
  - Sustained: 120s @ 50 req/s
  - Peak: 60s @ 100 req/s

**Results (Single Server):**

```
Scenarios launched:  10,800
Scenarios completed: 10,800
Requests completed:  21,600

Response times:
  min: 12ms
  max: 234ms
  median: 45ms
  p95: 98ms
  p99: 156ms

Success rate: 99.97%
```

**Bottlenecks Identified:**

1. Database connection pool saturation at >70 req/s
2. Password hashing CPU-bound at peak load
3. JWT signing/verification CPU-bound

**Mitigations:**

- Increase pool size to 50 for high-traffic environments
- Consider bcrypt → argon2 for better parallelism
- Cache JWT public keys for verification

---

## 7. Error Handling Strategy

### 7.1 Error Classification

```typescript
┌─────────────────────────────────────────────┐
│           All Errors                        │
│                                             │
│  ┌────────────────┬──────────────────────┐  │
│  │  Operational   │   Programming        │  │
│  │  (Expected)    │   (Unexpected)       │  │
│  │                │                      │  │
│  │  • Validation  │   • Null pointer     │  │
│  │  • Auth fails  │   • Type error       │  │
│  │  • Not found   │   • Unhandled error  │  │
│  │  • Rate limit  │   • Memory leak      │  │
│  └────────────────┴──────────────────────┘  │
│                                             │
│  Handled by:      Caught by:                │
│  AppError         Error handler             │
│  (isOperational)  (Send to Sentry)          │
└─────────────────────────────────────────────┘
```

### 7.2 AppError Class

```typescript
class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, any>,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods
  static badRequest(message: string, details?: any): AppError;
  static unauthorized(message?: string): AppError;
  static forbidden(message?: string): AppError;
  static notFound(message?: string): AppError;
  static conflict(message: string): AppError;
  static tooManyRequests(message?: string): AppError;
  static internal(message?: string): AppError;
}
```

**Usage:**

```typescript
// In use case
if (!user) {
  return Result.fail("User not found");
}

// In controller
if (result.isFailure) {
  throw AppError.notFound(result.error!);
}
```

### 7.3 Standard Error Response

```typescript
{
  "error": {
    "code": "ERROR_CODE",           // Machine-readable
    "message": "Human readable",    // User-friendly
    "details": {                    // Additional context
      "field": ["validation error"]
    },
    "requestId": "uuid"             // For debugging
  }
}
```

### 7.4 Error Scenarios

#### **Validation Error (400)**

**Request:**

```json
POST /api/v1/auth/signup
{
  "email": "invalid-email",
  "password": "weak",
  "name": "",
  "workspaceName": "X"
}
```

**Response:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Invalid email format"],
      "password": [
        "Password must be at least 8 characters",
        "Password must contain uppercase letter",
        "Password must contain special character"
      ],
      "name": ["Name must be at least 2 characters"],
      "workspaceName": ["Workspace name must be at least 2 characters"]
    },
    "requestId": "a7c8f2e1-4d5b-4c3a-9f8e-1a2b3c4d5e6f"
  }
}
```

#### **Authentication Error (401)**

**Request:**

```
GET /api/v1/auth/me
Authorization: Bearer invalid_token
```

**Response:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token",
    "requestId": "b8d9g3f2-5e6c-5d4b-0g9f-2b3c4d5e6f7g"
  }
}
```

#### **Authorization Error (403)**

**Request:**

```
DELETE /api/v1/admin/users/123
Authorization: Bearer <user_token>  // Regular user, not admin
```

**Response:**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource",
    "requestId": "c9e0h4g3-6f7d-6e5c-1h0g-3c4d5e6f7g8h"
  }
}
```

#### **Resource Not Found (404)**

**Request:**

```
GET /api/v1/users/nonexistent-id
```

**Response:**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found",
    "requestId": "d0f1i5h4-7g8e-7f6d-2i1h-4d5e6f7g8h9i"
  }
}
```

#### **Conflict (409)**

**Request:**

```json
POST /api/v1/auth/signup
{
  "email": "existing@example.com",
  "password": "Test123!@#",
  "name": "Test User",
  "workspaceName": "Test"
}
```

**Response:**

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Email already exists",
    "requestId": "e1g2j6i5-8h9f-8g7e-3j2i-5e6f7g8h9i0j"
  }
}
```

#### **Rate Limit (429)**

**Request:**

```
POST /api/v1/auth/login
(6th attempt within 15 minutes)
```

**Response:**

```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many authentication attempts. Please try again later.",
    "requestId": "f2h3k7j6-9i0g-9h8f-4k3j-6f7g8h9i0j1k"
  }
}
```

#### **Internal Server Error (500)**

**Request:**

```
POST /api/v1/auth/login
(Database connection lost)
```

**Response (Production):**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "requestId": "g3i4l8k7-0j1h-0i9g-5l4k-7g8h9i0j1k2l"
  }
}
```

**Response (Development):**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Connection to database failed",
    "requestId": "g3i4l8k7-0j1h-0i9g-5l4k-7g8h9i0j1k2l",
    "stack": "Error: Connection to database failed\n    at ..."
  }
}
```

### 7.5 Logging Strategy

```typescript
┌──────────────────────────────────────────────┐
│  Error Level Mapping                         │
├──────────────────────────────────────────────┤
│  DEBUG   → Detailed trace for development    │
│  INFO    → General application events        │
│  WARN    → Operational errors (expected)     │
│  ERROR   → Programming errors (unexpected)   │
└──────────────────────────────────────────────┘
```

**Log Format (Production - JSON):**

```json
{
  "timestamp": "2025-12-25T10:30:45.123Z",
  "level": "error",
  "message": "Database connection failed",
  "requestId": "uuid",
  "userId": "uuid",
  "error": {
    "message": "Connection refused",
    "stack": "Error: Connection refused\n    at ..."
  },
  "context": {
    "path": "/api/v1/auth/login",
    "method": "POST",
    "ip": "192.168.1.100"
  }
}
```

**Log Format (Development - Colorized):**

```
2025-12-25 10:30:45 ERROR: Database connection failed
  Request ID: uuid
  User ID: uuid
  Path: POST /api/v1/auth/login
  Error: Connection refused
  Stack: Error: Connection refused
      at Database.connect (/app/src/config/database.ts:45:11)
      at async connectDatabase (/app/src/config/database.ts:72:5)
```

### 7.6 Sentry Integration

**Initialization:**

```typescript
Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of requests
  profilesSampleRate: 0.1, // 10% profiling

  beforeSend(event, hint) {
    // Don't send operational errors
    if (hint.originalException?.isOperational) {
      return null;
    }

    // Sanitize sensitive data
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }

    return event;
  },
});
```

**What Gets Sent:**

- Unhandled exceptions
- Programming errors (non-operational)
- Stack traces
- User context (anonymized)
- Request details (sanitized)

**What Doesn't Get Sent:**

- Validation errors (expected)
- Authentication failures (expected)
- Rate limit errors (expected)
- Sensitive data (credentials, tokens)

---

## 8. Success Response Patterns

### 8.1 Standard Success Structure

```typescript
{
  "data": T        // Generic type for response data
}
```

**Why this format?**

- Consistent structure across all endpoints
- Easy to extend (can add `meta` later)
- Client knows where to find data
- Differentiates from error responses (which have `error` key)

### 8.2 Single Resource Response

**Example: Get Current User**

**Request:**

```
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "owner",
    "workspaceId": "w1x2y3z4-a5b6-c7d8-e9f0-g1h2i3j4k5l6"
  }
}
```

### 8.3 Created Resource Response

**Example: Sign Up**

**Request:**

```json
POST /api/v1/auth/signup
{
  "email": "newuser@example.com",
  "password": "Test123!@#",
  "name": "New User",
  "workspaceName": "New Workspace"
}
```

**Response (201 Created):**

```json
{
  "data": {
    "user": {
      "id": "u7v8w9x0-y1z2-a3b4-c5d6-e7f8g9h0i1j2",
      "email": "newuser@example.com",
      "name": "New User",
      "role": "owner",
      "workspaceId": "w2x3y4z5-a6b7-c8d9-e0f1-g2h3i4j5k6l7"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

### 8.4 List Response with Pagination

**Example: Get Users (Future endpoint)**

**Request:**

```
GET /api/v1/users?page=1&limit=20&sort=name&order=asc
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "u1...",
      "email": "alice@example.com",
      "name": "Alice",
      "role": "admin"
    },
    {
      "id": "u2...",
      "email": "bob@example.com",
      "name": "Bob",
      "role": "user"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 157,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 8.5 Empty List Response

**Example: No Results**

**Request:**

```
GET /api/v1/users?search=nonexistent
```

**Response (200 OK):**

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**Why 200 and not 404?**

- Empty list is a valid state
- 404 implies resource doesn't exist
- Client can check `data.length === 0`

### 8.6 No Content Response

**Example: Logout**

**Request:**

```
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

**Response (204 No Content):**

```
(Empty body)
```

**When to use 204?**

- Successful operation with nothing to return
- DELETE operations
- Logout/cleanup operations

### 8.7 Token Refresh Response

**Example: Refresh Access Token**

**Request:**

```json
POST /api/v1/auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

---

## 9. Runtime Scenarios

### 9.1 Normal Flow (Happy Path)

**Scenario: User Login**

```
┌─────────────────────────────────────────────┐
│  1. Request                                 │
│     POST /api/v1/auth/login                 │
│     { email, password }                     │
├─────────────────────────────────────────────┤
│  2. Middleware Chain                        │
│     ✓ Rate limit check (5/15min)            │
│     ✓ Zod validation passes                 │
│     ✓ Input sanitization                    │
├─────────────────────────────────────────────┤
│  3. Controller                              │
│     → LoginUseCase.execute()                │
├─────────────────────────────────────────────┤
│  4. Use Case                                │
│     ✓ User found in database                │
│     ✓ Password verified (bcrypt)            │
│     ✓ Tokens generated (JWT)                │
│     → Result.ok({ user, tokens })           │
├─────────────────────────────────────────────┤
│  5. Response                                │
│     200 OK                                  │
│     { data: { user, tokens } }              │
├─────────────────────────────────────────────┤
│  6. Logging                                 │
│     INFO: "User logged in"                  │
│     userId: "u123"                          │
│     duration: 145ms                         │
└─────────────────────────────────────────────┘
```

**Timeline:**

- Request received: 0ms
- Middleware processing: 5ms
- Database query: 50ms
- Password comparison: 80ms
- Token generation: 10ms
- Response sent: 145ms

**Database Queries:**

1. `SELECT * FROM users WHERE email = $1` (1 query, 50ms)

**Performance Metrics:**

- Memory: +2MB (temporary)
- CPU: 15% spike (bcrypt)

---

### 9.2 Invalid Input Scenario

**Scenario: Malformed Signup Request**

```
┌─────────────────────────────────────────────┐
│  1. Request                                 │
│     POST /api/v1/auth/signup                │
│     {                                       │
│       email: "not-an-email",                │
│       password: "123",                      │
│       name: "",                             │
│       workspaceName: "X"                    │
│     }                                       │
├─────────────────────────────────────────────┤
│  2. Middleware Chain                        │
│     ✓ Rate limit check passed               │
│     ✗ Zod validation FAILED                 │
├─────────────────────────────────────────────┤
│  3. Error Handler                           │
│     → ZodError transformed to AppError      │
├─────────────────────────────────────────────┤
│  4. Response                                │
│     400 Bad Request                         │
│     {                                       │
│       error: {                              │
│         code: "VALIDATION_ERROR",           │
│         message: "Validation failed",       │
│         details: {                          │
│           email: ["Invalid email"],         │
│           password: ["Min 8 chars",         │
│                      "Need uppercase",      │
│                      "Need special char"],  │
│           name: ["Min 2 chars"],            │
│           workspaceName: ["Min 2 chars"]    │
│         }                                   │
│       }                                     │
│     }                                       │
├─────────────────────────────────────────────┤
│  5. Logging                                 │
│     WARN: "Validation failed"               │
│     errors: [details]                       │
│     duration: 8ms                           │
└─────────────────────────────────────────────┘
```

**Timeline:**

- Request received: 0ms
- Middleware processing: 3ms
- Validation failed: 5ms
- Response sent: 8ms

**Key Points:**

- ✅ Fast failure (no database hit)
- ✅ Clear error messages for client
- ✅ Logged for monitoring
- ❌ Request doesn't reach business logic

---

### 9.3 Unauthorized Access Scenario

**Scenario: Invalid Token**

```
┌─────────────────────────────────────────────┐
│  1. Request                                 │
│     GET /api/v1/auth/me                     │
│     Authorization: Bearer invalid_token     │
├─────────────────────────────────────────────┤
│  2. Middleware Chain                        │
│     → authenticate middleware               │
│     → tokenService.verifyAccessToken()      │
│     ✗ JWT verification FAILED               │
├─────────────────────────────────────────────┤
│  3. Error Handler                           │
│     → AppError.unauthorized()               │
├─────────────────────────────────────────────┤
│  4. Response                                │
│     401 Unauthorized                        │
│     {                                       │
│       error: {                              │
│         code: "UNAUTHORIZED",               │
│         message: "Invalid token"            │
│       }                                     │
│     }                                       │
├─────────────────────────────────────────────┤
│  5. Logging                                 │
│     WARN: "Invalid token attempt"           │
│     ip: "192.168.1.100"                     │
│     duration: 12ms                          │
│                                             │
│  6. Security Event (if repeated)            │
│     → Potential attack detected             │
│     → IP may be rate-limited further        │
└─────────────────────────────────────────────┘
```

**Timeline:**

- Request received: 0ms
- Middleware processing: 5ms
- JWT verification failed: 10ms
- Response sent: 12ms

**Security Measures:**

- Token not logged (security)
- IP address recorded
- Sentry not alerted (expected error)

---

### 9.4 Rate Limit Exceeded Scenario

**Scenario: Brute Force Login Attempt**

```
┌─────────────────────────────────────────────┐
│  1. Request (6th attempt in 15 minutes)     │
│     POST /api/v1/auth/login                 │
│     { email, password }                     │
├─────────────────────────────────────────────┤
│  2. Middleware Chain                        │
│     → authLimiter checks request count      │
│     → 5/5 limit reached                     │
│     ✗ RATE LIMIT EXCEEDED                   │
├─────────────────────────────────────────────┤
│  3. Rate Limiter Handler                    │
│     → Immediate rejection                   │
│     → No further processing                 │
├─────────────────────────────────────────────┤
│  4. Response                                │
│     429 Too Many Requests                   │
│     {                                       │
│       error: {                              │
│         code: "AUTH_RATE_LIMIT_EXCEEDED",   │
│         message: "Too many auth attempts"   │
│       }                                     │
│     }                                       │
│     Retry-After: 900 (seconds)              │
├─────────────────────────────────────────────┤
│  5. Security Logging                        │
│     SECURITY: "Rate limit exceeded"         │
│     ip: "192.168.1.100"                     │
│     path: "/api/v1/auth/login"              │
│     attempts: 6                             │
│     window: "15 minutes"                    │
│                                             │
│  6. Optional Actions                        │
│     → Alert security team if repeated       │
│     → Block IP temporarily (future)         │
└─────────────────────────────────────────────┘
```

**Timeline:**

- Request received: 0ms
- Rate limit check: 2ms
- Response sent: 3ms

**Key Points:**

- ✅ Extremely fast rejection
- ✅ No database load
- ✅ Attack documented
- ✅ `Retry-After` header guides client

**Client Behavior:**

```typescript
// Client should respect 429 and wait
if (response.status === 429) {
  const retryAfter = response.headers.get("Retry-After");
  await sleep(retryAfter * 1000);
  // Retry request
}
```

---

### 9.5 Database Failure Scenario

**Scenario: PostgreSQL Connection Lost**

```
┌─────────────────────────────────────────────┐
│  1. Request                                 │
│     POST /api/v1/auth/login                 │
│     { email, password }                     │
├─────────────────────────────────────────────┤
│  2. Middleware Chain                        │
│     ✓ All middleware passes                 │
├─────────────────────────────────────────────┤
│  3. Controller → Use Case                   │
│     → UserRepository.findByEmail()          │
├─────────────────────────────────────────────┤
│  4. Database Query                          │
│     → Sequelize attempts connection         │
│     ✗ Connection refused                    │
│     ✗ Error: ECONNREFUSED                   │
├─────────────────────────────────────────────┤
│  5. Repository Layer                        │
│     → Catches database error                │
│     → Throws AppError.internal()            │
├─────────────────────────────────────────────┤
│  6. Error Handler                           │
│     → Logs full error with stack trace      │
│     → Sends to Sentry                       │
│     → Returns generic 500 to client         │
├─────────────────────────────────────────────┤
│  7. Response (Production)                   │
│     500 Internal Server Error               │
│     {                                       │
│       error: {                              │
│         code: "INTERNAL_ERROR",             │
│         message: "An unexpected error       │
│                   occurred"                 │
│       }                                     │
│     }                                       │
│                                             │
│     (No stack trace exposed)                │
├─────────────────────────────────────────────┤
│  8. Logging                                 │
│     ERROR: "Database connection failed"     │
│     error: "ECONNREFUSED"                   │
│     stack: [full stack trace]               │
│     requestId: "uuid"                       │
│     duration: 5023ms                        │
├─────────────────────────────────────────────┤
│  9. Sentry Alert                            │
│     → Error reported to Sentry              │
│     → Stack trace included                  │
│     → Context: requestId, path, user        │
│     → Team notified via Slack/email         │
├─────────────────────────────────────────────┤
│  10. Recovery Attempt                       │
│     → Sequelize auto-retry (3 attempts)     │
│     → Connection pool recreated             │
│     → Health check endpoint returns 503     │
└─────────────────────────────────────────────┘
```

**Timeline:**

- Request received: 0ms
- Middleware processing: 5ms
- Database connection attempt: 5000ms (timeout)
- Response sent: 5023ms

**Automatic Recovery:**

```typescript
// Database config
retry: {
  max: 3,        // 3 retry attempts
  timeout: 3000  // 3 seconds between retries
}
```

**Health Check During Outage:**

```
GET /health
→ 200 OK (basic health)

GET /health/detailed
→ 503 Service Unavailable
{
  status: "degraded",
  checks: {
    database: {
      status: "down",
      error: "Connection refused"
    }
  }
}
```

**Monitoring Actions:**

1. Ops team alerted immediately
2. Database connectivity checked
3. Failover to replica (if configured)
4. Root cause analysis initiated

---

### 9.6 Server Crash Scenario

**Scenario: Unhandled Exception**

```
┌─────────────────────────────────────────────┐
│  1. Request                                 │
│     POST /api/v1/auth/signup                │
│     { ... }                                 │
├─────────────────────────────────────────────┤
│  2. Processing                              │
│     → Use case executing                    │
│     → Unexpected null pointer error         │
│     ✗ TypeError: Cannot read property 'id'  │
│        of undefined                         │
├─────────────────────────────────────────────┤
│  3. Error Propagation                       │
│     → asyncHandler catches Promise reject   │
│     → Passes to errorHandler middleware     │
├─────────────────────────────────────────────┤
│  4. Error Handler                           │
│     → Identifies as programming error       │
│     → isOperational = false                 │
│     → Logs full stack trace                 │
│     → Sends to Sentry                       │
├─────────────────────────────────────────────┤
│  5. Response                                │
│     500 Internal Server Error               │
│     {                                       │
│       error: {                              │
│         code: "INTERNAL_ERROR",             │
│         message: "An unexpected error"      │
│       }                                     │
│     }                                       │
├─────────────────────────────────────────────┤
│  6. Logging                                 │
│     ERROR: "Unhandled error"                │
│     error: "TypeError: Cannot read..."      │
│     stack: [full trace]                     │
│     context: {                              │
│       requestId, path, method, body         │
│     }                                       │
├─────────────────────────────────────────────┤
│  7. Sentry Alert (High Priority)            │
│     → Immediate alert                       │
│     → Full context sent                     │
│     → Similar errors grouped                │
│     → Assign to on-call engineer            │
├─────────────────────────────────────────────┤
│  8. Process Continues                       │
│     ✓ Server stays running (no crash)       │
│     ✓ Other requests unaffected             │
│     ✓ Error isolated to this request        │
│                                             │
│     (No process restart needed)             │
└─────────────────────────────────────────────┘
```

**Why Server Doesn't Crash:**

- Express error middleware catches all errors
- `asyncHandler` wraps all route handlers
- Process remains healthy

**PM2 Configuration (if crash occurs):**

```javascript
{
  autorestart: true,
  max_restarts: 10,
  min_uptime: "10s"
}
```

**Process Restart Flow:**

```
1. PM2 detects process exit
2. Waits 1 second
3. Restarts process
4. Reconnects to database
5. Resumes accepting requests
   (within ~2 seconds)
```

---

### 9.7 Memory Leak Scenario

**Scenario: Gradual Memory Growth**

```
┌─────────────────────────────────────────────┐
│  Detection                                  │
│     → Metrics show increasing memory        │
│     → heapUsed: 200MB → 400MB → 600MB       │
│     → Over 6 hours                          │
├─────────────────────────────────────────────┤
│  Monitoring Alert                           │
│     → Prometheus scrapes /metrics           │
│     → Alert: "Memory usage > 500MB"         │
│     → Team notified                         │
├─────────────────────────────────────────────┤
│  Immediate Actions                          │
│     1. Review metrics/logs                  │
│     2. Check for stuck connections          │
│     3. Analyze heap dump                    │
├─────────────────────────────────────────────┤
│  PM2 Auto-Restart (if configured)           │
│     max_memory_restart: "500M"              │
│     → Process automatically restarted       │
│     → Memory cleared                        │
│     → Service continues with new process    │
├─────────────────────────────────────────────┤
│  Root Cause Analysis                        │
│     → Heap snapshot captured                │
│     → Memory profile analyzed               │
│     → Leak source identified                │
│     → Fix deployed                          │
└─────────────────────────────────────────────┘
```

**Prevention:**

- Metrics monitoring
- Automatic restarts
- Connection pooling
- Proper cleanup in finally blocks

---

## 10. Development Guidelines

### 10.1 Code Style

**TypeScript Configuration:**

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

**ESLint + Prettier:**

```bash
# Lint code
npm run lint

# Auto-fix
npm run lint:fix

# Format code
npm run format
```

### 10.2 Testing Strategy

**Test Pyramid:**

```
        /\
       /  \    E2E Tests (10%)
      /────\   Integration Tests (30%)
     /──────\  Unit Tests (60%)
    /────────\
```

**Test Coverage Targets:**

```
Statements: 70%
Branches: 60%
Functions: 70%
Lines: 70%
```

**Running Tests:**

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Specific file
npm test -- User.test.ts
```

### 10.3 Git Workflow

**Branch Strategy:**

```
main (production)
  ↓
develop (staging)
  ↓
feature/AUTH-123-add-2fa
bugfix/AUTH-124-fix-token-expiry
hotfix/AUTH-125-security-patch
```

**Commit Convention:**

```
<type>(<scope>): <subject>

feat(auth): add two-factor authentication
fix(auth): correct token expiration time
docs(readme): update installation instructions
test(auth): add login use case tests
refactor(repository): improve query performance
```

### 10.4 Adding New Features

**Checklist:**

1. ✅ Define domain entity (if needed)
2. ✅ Create repository interface
3. ✅ Implement repository
4. ✅ Create use case
5. ✅ Add validation schema
6. ✅ Create controller
7. ✅ Define route
8. ✅ Write tests (unit + integration)
9. ✅ Update documentation
10. ✅ Create migration (if DB changes)

**Example: Add Password Change Feature**

```typescript
// 1. Domain (no changes needed, User entity exists)

// 2. Repository interface (IUserRepository.ts)
interface IUserRepository {
  // ... existing methods
  updatePassword(userId: string, newHash: string): Promise<void>;
}

// 3. Implement (UserRepository.ts)
async updatePassword(userId: string, newHash: string): Promise<void> {
  await UserModel.update(
    { password: newHash },
    { where: { id: userId } }
  );
}

// 4. Use case (ChangePasswordUseCase.ts)
export class ChangePasswordUseCase {
  async execute(req: ChangePasswordRequest): Promise<Result<void>> {
    // Verify current password
    // Hash new password
    // Update in repository
    // Log audit event
  }
}

// 5. Validation (authValidators.ts)
export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: passwordSchema
});

// 6. Controller (AuthController.ts)
changePassword = async (req, res, next) => {
  const result = await this.changePasswordUseCase.execute({
    userId: req.user!.userId,
    ...req.body
  });
  if (result.isFailure) throw AppError.badRequest(result.error!);
  res.status(200).json({ data: { message: "Password updated" } });
};

// 7. Route (authRoutes.ts)
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  asyncHandler((req, res, next) =>
    authController.changePassword(req, res, next)
  )
);

// 8. Tests
describe("ChangePasswordUseCase", () => {
  it("should update password successfully", async () => {
    // Test implementation
  });
});

// 9. Documentation (update this file)

// 10. Migration (if needed)
// Already exists, no schema changes
```

---

## 11. Deployment & Operations

### 11.1 Environment Setup

**Development:**

```bash
cp .env.example .env
npm install
docker-compose up -d  # Start PostgreSQL
npm run db:migrate    # Run migrations
npm run dev           # Start dev server
```

**Production:**

```bash
# 1. Build
npm run build

# 2. Start with PM2
pm2 start ecosystem.config.js --env production

# 3. Monitor
pm2 monit

# 4. Logs
pm2 logs devcycle-api
```

### 11.2 Docker Deployment

**Dockerfile (Multi-stage):**

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
RUN addgroup -g 1001 nodejs && \
    adduser -S nodejs -u 1001
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./
USER nodejs
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**Docker Compose:**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 11.3 Health Checks

**Kubernetes Probes:**

```yaml
livenessProbe:
  httpGet:
    path: /live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

### 11.4 Monitoring Dashboard

**Key Metrics:**

- Request rate (req/s)
- Error rate (%)
- Response time (p50, p95, p99)
- Memory usage (MB)
- CPU usage (%)
- Database connections

**Prometheus Queries:**

```promql
# Error rate
rate(http_errors_total[5m]) / rate(http_requests_total[5m])

# p95 response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Database connection pool
pg_connections_active / pg_connections_max
```

### 11.5 Backup Strategy

**Database Backups:**

```bash
# Daily automated backup
0 2 * * * /scripts/backup.sh

# Retention: 30 days
# Upload to S3
```

**Disaster Recovery:**

- RTO (Recovery Time Objective): < 1 hour
- RPO (Recovery Point Objective): < 24 hours
- Restore procedure documented

---

## 12. Appendix

### 12.1 Glossary

| Term                   | Definition                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Clean Architecture** | Architectural pattern emphasizing separation of concerns and dependency inversion      |
| **DDD**                | Domain-Driven Design - approach to software development focused on the business domain |
| **JWT**                | JSON Web Token - standard for transmitting information securely                        |
| **TOTP**               | Time-based One-Time Password - algorithm for 2FA                                       |
| **CORS**               | Cross-Origin Resource Sharing - security feature for web browsers                      |
| **ORM**                | Object-Relational Mapping - technique for converting data between systems              |

### 12.2 References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### 12.3 Change Log

| Version | Date       | Changes               |
| ------- | ---------- | --------------------- |
| 1.0.0   | 2025-12-25 | Initial documentation |

---

**End of Technical Documentation**
