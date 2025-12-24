# Devcycle API - Technical Documentation

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [API Flow](#api-flow)
- [Authentication & Security](#authentication--security)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Error Handling](#error-handling)
- [Dependencies](#dependencies)
- [Deployment](#deployment)

---

## 🏗️ Architecture Overview

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────┐
│           Presentation Layer                    │
│  (Controllers, Routes, Middlewares, DTOs)       │
├─────────────────────────────────────────────────┤
│           Application Layer                     │
│  (Use Cases, Business Logic)                    │
├─────────────────────────────────────────────────┤
│              Domain Layer                       │
│  (Entities, Value Objects, Domain Logic)        │
├─────────────────────────────────────────────────┤
│          Infrastructure Layer                   │
│  (Database, External Services, Security)        │
└─────────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── config/                    # Configuration files
│   ├── constants.ts          # Application constants
│   ├── database.ts           # Database configuration
│   └── env.ts                # Environment validation
├── infrastructure/
│   ├── database/
│   │   └── models/          # Sequelize models
│   └── http/
│       ├── middlewares/     # Express middlewares
│       └── routes/          # Route definitions
├── modules/
│   └── auth/
│       ├── application/     # Use cases
│       ├── domain/          # Domain entities
│       ├── infrastructure/  # Repositories, security
│       └── presentation/    # Controllers, routes
├── shared/
│   ├── application/         # Shared use case patterns
│   ├── domain/              # Shared domain logic
│   └── infrastructure/      # Logger, utilities
├── app.ts                   # Express app setup
└── server.ts               # Server entry point
```

---

## 🔄 API Flow

### Complete Request-Response Cycle

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ HTTP Request
     ▼
┌─────────────────────────────────────────────────┐
│              Express Middleware Chain            │
├─────────────────────────────────────────────────┤
│ 1. Helmet (Security Headers)                    │
│ 2. CORS (Cross-Origin Resource Sharing)         │
│ 3. Rate Limiter (DDoS Protection)               │
│ 4. Body Parser (JSON/URL Encoded)               │
│ 5. Request ID (Tracing)                         │
│ 6. Request Logger (Structured Logging)          │
│ 7. Input Sanitization (XSS Prevention)          │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│              Route Matching                      │
├─────────────────────────────────────────────────┤
│ • /health → Health Check                        │
│ • /api/v1/auth/* → Auth Routes                  │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│         Route-Specific Middleware                │
├─────────────────────────────────────────────────┤
│ 1. Rate Limiter (Auth-specific)                 │
│ 2. Validation (Zod Schema)                      │
│ 3. Authentication (JWT Verify)                  │
│ 4. Async Handler (Error Catching)               │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│              Controller                          │
├─────────────────────────────────────────────────┤
│ • Parse request                                  │
│ • Call use case                                  │
│ • Handle result                                  │
│ • Return response                                │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│              Use Case                            │
├─────────────────────────────────────────────────┤
│ • Validate business rules                       │
│ • Orchestrate domain logic                      │
│ • Call repositories                              │
│ • Return Result<T>                               │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│           Repository Layer                       │
├─────────────────────────────────────────────────┤
│ • Database operations                            │
│ • Transaction management                         │
│ • Model ↔ Entity mapping                        │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│           PostgreSQL Database                    │
└─────────────────────────────────────────────────┘
```

### Error Flow

```
Error occurs at any layer
         │
         ▼
   Error caught by:
   • Async Handler
   • Express error handler
         │
         ▼
   Error Handler Middleware
   • AppError → Operational
   • Other → Internal Error
         │
         ▼
   Logged via Winston
         │
         ▼
   JSON Response to Client
```

---

## 🔐 Authentication & Security

### JWT Token Flow

```
1. User Login
   ├─→ Validate credentials
   ├─→ Generate access token (15min)
   ├─→ Generate refresh token (7 days)
   └─→ Return both tokens

2. Authenticated Request
   ├─→ Client sends: Authorization: Bearer <token>
   ├─→ Middleware verifies token
   ├─→ Extracts user info
   └─→ Attaches to req.user

3. Token Refresh
   ├─→ Client sends refresh token
   ├─→ Validate refresh token
   ├─→ Generate new access token
   └─→ Return new tokens
```

### Security Features

#### 1. **Password Security**

- Bcrypt hashing (12 rounds)
- Strong password requirements:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character
  - No whitespace

#### 2. **Rate Limiting**

- Global: 100 requests/minute
- Auth endpoints: 5 requests/15 minutes
- Prevents brute force attacks

#### 3. **Input Validation**

- Zod schema validation
- Input sanitization (XSS prevention)
- Email normalization

#### 4. **Security Headers (Helmet)**

- Content Security Policy
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options

#### 5. **CORS Configuration**

- Whitelist allowed origins
- Credentials support
- Security logging for violations

---

## 📡 API Endpoints

### Health Endpoints

#### `GET /health`

Basic health check.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-25T10:00:00.000Z",
  "uptime": 3600.5,
  "environment": "production",
  "version": "1.0.0"
}
```

#### `GET /health/detailed`

Detailed health check with dependency status.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-25T10:00:00.000Z",
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 15
    },
    "memory": {
      "used": 128,
      "total": 256,
      "unit": "MB"
    }
  }
}
```

### Authentication Endpoints

#### `POST /api/v1/auth/signup`

Create new user account and workspace.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "workspaceName": "My Workspace"
}
```

**Response (201):**

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner",
      "workspaceId": "uuid"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "jwt_token",
      "expiresIn": 900
    }
  }
}
```

**Errors:**

- `400`: Validation failed
- `409`: Email already exists
- `429`: Too many requests

---

#### `POST /api/v1/auth/login`

Authenticate existing user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner",
      "workspaceId": "uuid"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "jwt_token",
      "expiresIn": 900
    }
  }
}
```

**Errors:**

- `401`: Invalid credentials
- `429`: Too many requests

---

#### `GET /api/v1/auth/me`

Get current authenticated user.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200):**

```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "owner",
    "workspaceId": "uuid"
  }
}
```

**Errors:**

- `401`: Unauthorized (invalid/expired token)
- `404`: User not found

---

#### `POST /api/v1/auth/refresh`

Refresh access token.

**Request Body:**

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response (200):**

```json
{
  "data": {
    "accessToken": "new_jwt_token",
    "refreshToken": "new_refresh_token",
    "expiresIn": 900
  }
}
```

**Errors:**

- `401`: Invalid refresh token

---

#### `POST /api/v1/auth/logout`

Logout current user.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (204):**
No content

---

## 🗄️ Database Schema

### Tables

#### **workspaces**

```sql
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### **users**

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_workspace_id ON users(workspace_id);
```

### Relationships

- One workspace has many users
- One workspace has one owner (user)
- Users belong to one workspace

---

## ⚠️ Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {
      "field": ["validation error"]
    },
    "requestId": "uuid"
  }
}
```

### Error Codes

| Code                | Status | Description               |
| ------------------- | ------ | ------------------------- |
| `VALIDATION_ERROR`  | 400    | Request validation failed |
| `BAD_REQUEST`       | 400    | Invalid request           |
| `UNAUTHORIZED`      | 401    | Authentication required   |
| `FORBIDDEN`         | 403    | Insufficient permissions  |
| `NOT_FOUND`         | 404    | Resource not found        |
| `CONFLICT`          | 409    | Resource conflict         |
| `TOO_MANY_REQUESTS` | 429    | Rate limit exceeded       |
| `INTERNAL_ERROR`    | 500    | Server error              |

### Logging

All errors are logged with Winston:

- **Operational errors**: Logged at `warn` level
- **Internal errors**: Logged at `error` level with stack traces
- **Security events**: Logged with `SECURITY` prefix

Log format (production):

```json
{
  "timestamp": "2025-01-25T10:00:00.000Z",
  "level": "error",
  "message": "Error description",
  "requestId": "uuid",
  "userId": "uuid",
  "stack": "..."
}
```

---

## 📦 Dependencies

### Core Dependencies

| Package      | Version | Purpose           |
| ------------ | ------- | ----------------- |
| `express`    | ^4.18.2 | Web framework     |
| `typescript` | ^5.3.3  | Type safety       |
| `sequelize`  | ^6.35.2 | ORM               |
| `pg`         | ^8.11.3 | PostgreSQL driver |

### Security

| Package              | Version | Purpose          |
| -------------------- | ------- | ---------------- |
| `helmet`             | ^7.1.0  | Security headers |
| `bcrypt`             | ^5.1.1  | Password hashing |
| `jsonwebtoken`       | ^9.0.2  | JWT tokens       |
| `cors`               | ^2.8.5  | CORS handling    |
| `express-rate-limit` | ^7.1.5  | Rate limiting    |

### Validation & Utilities

| Package   | Version | Purpose               |
| --------- | ------- | --------------------- |
| `zod`     | ^3.22.4 | Schema validation     |
| `dotenv`  | ^16.3.1 | Environment variables |
| `winston` | ^3.11.0 | Logging               |
| `uuid`    | ^9.0.1  | UUID generation       |

---

## 🚀 Deployment

### Environment Variables

Required variables (see `.env.example`):

```bash
NODE_ENV=production
PORT=3000
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
JWT_ACCESS_SECRET=min_32_chars_random_string
JWT_REFRESH_SECRET=different_32_chars_string
ALLOWED_ORIGINS=https://yourdomain.com
```

### Database Setup

```bash
# 1. Create database
createdb devcycle_production

# 2. Run schema
psql devcycle_production < database/schema.sql

# 3. Or use migrations (recommended)
npm run migrate
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique JWT secrets (min 32 chars)
- [ ] Configure ALLOWED_ORIGINS properly
- [ ] Use strong database password
- [ ] Enable SSL for database connection
- [ ] Set up proper logging
- [ ] Configure reverse proxy (nginx)
- [ ] Enable HTTPS
- [ ] Set up monitoring (health checks)
- [ ] Configure graceful shutdown
- [ ] Use process manager (PM2)

### Docker Deployment

```bash
# Build
docker build -t devcycle-api .

# Run
docker run -d \
  --name devcycle-api \
  -p 3000:3000 \
  --env-file .env.production \
  devcycle-api
```

### Health Checks

Configure your load balancer/orchestrator to use:

- **Liveness probe**: `GET /live`
- **Readiness probe**: `GET /ready`

---

## 🔧 Development

### Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your values

# 3. Start database
docker-compose up -d postgres

# 4. Start development server
npm run dev
```

### Scripts

```bash
npm run dev      # Development with hot reload
npm run build    # Compile TypeScript
npm start        # Production server
npm test         # Run tests
npm run lint     # Lint code
```

---

## 📊 Performance Considerations

### Database Connection Pool

- **Max connections**: 20
- **Min connections**: 5
- **Acquire timeout**: 60s
- **Idle timeout**: 10s

### Rate Limiting

- Adjust based on your needs
- Monitor 429 responses
- Consider Redis for distributed systems

### Monitoring Recommendations

- Set up APM (Application Performance Monitoring)
- Track response times
- Monitor database query performance
- Alert on error rates

---

## 🔄 Future Improvements

1. **Caching**: Add Redis for session management
2. **Testing**: Implement unit and integration tests
3. **Documentation**: Add Swagger/OpenAPI spec
4. **Observability**: Add distributed tracing
5. **Features**:
   - Password reset flow
   - Email verification
   - Two-factor authentication
   - OAuth providers

---

**Version**: 1.0.0  
**Last Updated**: December 2025

Run these commands in order:

1. Install test dependencies:
   npm install --save-dev jest @types/jest ts-jest supertest @types/supertest

2. Create test database (Docker):
   docker-compose -f docker-compose.test.yml up -d

3. Run tests:
   npm test

4. Run with coverage:
   npm run test:coverage

5. Run specific test:
   npm test -- User.test.ts

6. Watch mode:
   npm run test:watch

7. Install dependencies:
   npm install @sentry/node @sentry/profiling-node umzug
   pnpm install --save-dev sequelize-cli

8. Set up Sentry:

## ************\*\*\*\*************

- Sign up at https://sentry.io
- Create new project
- Copy DSN
- Add to .env: SENTRY_DSN=https://...

3. Run migrations:
   npx sequelize-cli db:migrate

4. Check migration status:
   npx sequelize-cli db:migrate:status

5. Rollback last migration:
   npx sequelize-cli db:migrate:undo

6. Create new migration:
   npm run db:migration:create -- add-email-verification

7. View metrics (after starting server):
   curl http://localhost:3000/metrics

8. View Prometheus metrics:
   curl http://localhost:3000/metrics/prometheus
