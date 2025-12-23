# DevCycle API - Technical Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [API Flow](#api-flow)
4. [Endpoints Documentation](#endpoints-documentation)
5. [Authentication & Authorization](#authentication--authorization)
6. [Database Schema](#database-schema)
7. [Dependencies](#dependencies)
8. [Deployment](#deployment)
9. [Monitoring & Observability](#monitoring--observability)

---

## 1. System Overview

### Purpose
DevCycle is an enterprise-grade project management platform designed to streamline software development workflows. The backend API provides robust authentication, role-based access control, and comprehensive project management capabilities.

### Key Features
- **Clean Architecture**: Domain-Driven Design with clear separation of concerns
- **Type Safety**: Full TypeScript implementation
- **Security**: JWT authentication, RBAC, rate limiting, account lockout
- **Scalability**: Redis caching, connection pooling, horizontal scaling support
- **Observability**: Structured logging, metrics, distributed tracing
- **Testing**: Comprehensive unit and integration test coverage

### Technology Stack
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Authentication**: JWT (jsonwebtoken)
- **ORM**: Sequelize with sequelize-typescript
- **Testing**: Jest + Supertest
- **Documentation**: Swagger/OpenAPI

---

## 2. Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────┐
│         Presentation Layer                  │
│  (Controllers, Routes, Middlewares)         │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         Application Layer                   │
│    (Use Cases, DTOs, Validation)            │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           Domain Layer                      │
│  (Entities, Value Objects, Repositories)    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│       Infrastructure Layer                  │
│ (Database, Cache, External Services)        │
└─────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── config/                    # Configuration files
│   ├── database.ts
│   ├── env.ts
│   └── validateEnv.ts
├── infrastructure/            # Infrastructure concerns
│   ├── cache/                # Redis cache layer
│   ├── database/             # Database configuration
│   ├── http/                 # HTTP layer (Express)
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   └── responses/
│   ├── logging/              # Logging infrastructure
│   └── observability/        # Metrics and tracing
├── modules/                   # Feature modules
│   ├── auth/                 # Authentication module
│   │   ├── application/      # Use cases and DTOs
│   │   ├── domain/           # Domain entities
│   │   ├── infrastructure/   # Repositories and services
│   │   └── presentation/     # Controllers and routes
│   └── settings/             # User settings module
├── shared/                    # Shared code
│   ├── application/          # Shared application logic
│   ├── domain/               # Shared domain concepts
│   └── infrastructure/       # Shared infrastructure
├── app.ts                    # Express app setup
└── server.ts                 # Server entry point
```

### Design Patterns

1. **Repository Pattern**: Abstraction over data access
2. **Use Case Pattern**: Application business logic encapsulation
3. **Value Objects**: Immutable domain primitives
4. **Aggregate Roots**: Domain consistency boundaries
5. **Dependency Injection**: Loose coupling between layers
6. **Decorator Pattern**: Cache, logging, and cross-cutting concerns

---

## 3. API Flow

### Request Flow Diagram

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │─────▶│  Nginx   │─────▶│ Express  │─────▶│Middleware│
└──────────┘      └──────────┘      └──────────┘      └─────┬────┘
                                                              │
                  ┌───────────────────────────────────────────┘
                  │
      ┌───────────▼───────────┐
      │   Security Layer      │
      │ - CORS                │
      │ - Helmet              │
      │ - Rate Limiting       │
      │ - XSS Protection      │
      │ - SQL Injection       │
      └───────────┬───────────┘
                  │
      ┌───────────▼───────────┐
      │   Authentication      │
      │ - JWT Verification    │
      │ - Token Validation    │
      └───────────┬───────────┘
                  │
      ┌───────────▼───────────┐
      │   Authorization       │
      │ - Role Checking       │
      │ - Permission Validation│
      └───────────┬───────────┘
                  │
      ┌───────────▼───────────┐
      │   Controller          │
      │ - Input Validation    │
      │ - Use Case Execution  │
      └───────────┬───────────┘
                  │
      ┌───────────▼───────────┐
      │   Use Case            │
      │ - Business Logic      │
      │ - Domain Operations   │
      └───────────┬───────────┘
                  │
      ┌───────────▼───────────┐
      │   Repository          │
      │ - Data Access         │
      │ - Cache Check         │
      └───────────┬───────────┘
                  │
      ┌───────────▼───────────┐
      │   Database/Cache      │
      │ - PostgreSQL          │
      │ - Redis               │
      └───────────┬───────────┘
                  │
      ┌───────────▼───────────┐
      │   Response            │
      │ - Format Response     │
      │ - Error Handling      │
      │ - Logging             │
      └───────────────────────┘
```

### Typical Request Flow (Login Example)

1. **Client Request**
   ```http
   POST /api/v1/auth/login
   Content-Type: application/json
   
   {
     "email": "user@example.com",
     "password": "Password123!"
   }
   ```

2. **Middleware Chain**
   - Request ID generation
   - CORS validation
   - Rate limiting check
   - XSS protection
   - SQL injection protection
   - Request logging

3. **Validation**
   - Express-validator checks
   - Email format validation
   - Password presence check

4. **Controller Layer**
   ```typescript
   async login(req: Request, res: Response) {
     const result = await this.loginUseCase.execute(req.body);
     return ApiResponse.success(res, result.getValue());
   }
   ```

5. **Use Case Execution**
   - Account lockout check
   - Email normalization
   - User retrieval from repository
   - Password verification
   - Token generation
   - Audit logging

6. **Repository Layer**
   - Cache check (Redis)
   - Database query (PostgreSQL)
   - Domain entity mapping

7. **Response**
   ```json
   {
     "data": {
       "user": {
         "id": "uuid",
         "email": "user@example.com",
         "name": "User Name",
         "role": "user"
       },
       "tokens": {
         "accessToken": "jwt_token",
         "refreshToken": "jwt_refresh",
         "expiresIn": 3600
       }
     },
     "meta": {
       "requestId": "req-uuid",
       "timestamp": "2025-01-01T00:00:00Z"
     }
   }
   ```

---

## 4. Endpoints Documentation

### Authentication Endpoints

#### POST /api/v1/auth/signup
**Description**: Register a new user account

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "John Doe",
  "workspaceName": "My Workspace" // optional
}
```

**Validation Rules**:
- Email: Valid email format, max 255 characters
- Password: Min 8 characters, uppercase, lowercase, number
- Name: 2-100 characters

**Response**: `201 Created`
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "emailVerified": false,
      "workspaceId": "workspace-uuid"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "jwt_refresh",
      "expiresIn": 3600
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation failed
- `409 Conflict`: Email already exists

---

#### POST /api/v1/auth/login
**Description**: Authenticate user and receive tokens

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response**: `200 OK`
```json
{
  "data": {
    "user": { /* user object */ },
    "tokens": { /* tokens object */ }
  }
}
```

**Security Features**:
- Account lockout after 5 failed attempts
- 15-minute lockout duration
- IP-based rate limiting (100 req/min)
- Strict login endpoint rate limiting (5 req/15min)

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
- `401 Unauthorized`: Account locked
- `429 Too Many Requests`: Rate limit exceeded

---

#### GET /api/v1/auth/me
**Description**: Get current authenticated user

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**: `200 OK`
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin",
    "permissions": [
      "products:read",
      "products:create",
      "admin:access"
    ],
    "emailVerified": true,
    "workspaceId": "workspace-uuid"
  }
}
```

---

#### POST /api/v1/auth/refresh
**Description**: Refresh access token using refresh token

**Request Body**:
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response**: `200 OK`
```json
{
  "data": {
    "accessToken": "new_jwt_token",
    "refreshToken": "new_refresh_token",
    "expiresIn": 3600
  }
}
```

---

#### PATCH /api/v1/auth/me
**Description**: Update user profile

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "Updated Name",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response**: `200 OK`

---

#### POST /api/v1/auth/password/change
**Description**: Change user password

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response**: `200 OK`

**Security**:
- Requires current password verification
- Invalidates all existing tokens
- Audit log entry created

---

### User Settings Endpoints

#### GET /api/v1/users/me/settings
**Description**: Get user settings

**Response**: `200 OK`
```json
{
  "data": {
    "theme": "dark",
    "language": "en",
    "timezone": "UTC",
    "dateFormat": "YYYY-MM-DD",
    "weekStartsOn": 1,
    "emailNotifications": true,
    "pushNotifications": true,
    "compactMode": false
  }
}
```

---

#### PATCH /api/v1/users/me/settings
**Description**: Update user settings

**Request Body**: (all fields optional)
```json
{
  "theme": "light",
  "language": "en",
  "timezone": "America/New_York",
  "emailNotifications": false
}
```

---

#### GET /api/v1/users/me/notifications
**Description**: Get notification preferences

**Response**: `200 OK`
```json
{
  "data": {
    "taskAssigned": true,
    "taskCompleted": true,
    "bugReported": true,
    "weeklyDigest": true
  }
}
```

---

### Admin Endpoints

#### POST /api/v1/auth/roles/assign
**Description**: Assign role to user (Admin only)

**Headers**: `Authorization: Bearer <admin_token>`

**Request Body**:
```json
{
  "userId": "user-uuid",
  "role": "moderator"
}
```

**Roles**:
- `owner`: Full access (set during workspace creation)
- `admin`: All permissions except CORS management
- `moderator`: Limited administrative access
- `user`: Standard user access

**Response**: `200 OK`

**Error Responses**:
- `403 Forbidden`: Insufficient permissions

---

#### GET /api/v1/admin/cors
**Description**: Get CORS configuration (Owner only)

**Response**: `200 OK`
```json
{
  "data": {
    "enabled": true,
    "origins": [
      "http://localhost:8080",
      "https://yourdomain.com"
    ],
    "credentials": true
  }
}
```

---

## 5. Authentication & Authorization

### JWT Token Structure

**Access Token** (1 hour expiry):
```json
{
  "userId": "uuid",
  "workspaceId": "workspace-uuid",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Refresh Token** (7 days expiry):
```json
{
  "userId": "uuid",
  "workspaceId": "workspace-uuid",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1235172690
}
```

### Role-Based Access Control (RBAC)

#### Permission Matrix

| Permission | Owner | Admin | Moderator | User |
|-----------|-------|-------|-----------|------|
| products:read | ✓ | ✓ | ✓ | ✓ |
| products:create | ✓ | ✓ | ✓ | ✓ |
| products:update | ✓ | ✓ | ✓ | ✗ |
| products:delete | ✓ | ✓ | ✗ | ✗ |
| admin:access | ✓ | ✓ | ✗ | ✗ |
| admin:cors | ✓ | ✗ | ✗ | ✗ |
| admin:promote_admin | ✓ | ✗ | ✗ | ✗ |

### Security Mechanisms

1. **Password Requirements**
   - Minimum 8 characters
   - At least 1 uppercase letter
   - At least 1 lowercase letter
   - At least 1 number
   - Hashed using bcrypt (12 rounds)

2. **Rate Limiting**
   - Global: 100 requests/minute per IP
   - Login endpoint: 5 requests/15 minutes per IP
   - Authenticated: 200 requests/minute per user

3. **Account Lockout**
   - 5 failed login attempts
   - 15-minute lockout period
   - Failed attempts reset on successful login

4. **Token Security**
   - JWT secrets minimum 64 characters
   - High entropy requirement
   - Tokens signed with HS256 algorithm
   - Refresh token rotation on use

---

## 6. Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar VARCHAR(500),
  email_verified BOOLEAN DEFAULT FALSE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_workspace ON users(workspace_id);
CREATE INDEX idx_users_workspace_verified ON users(workspace_id, email_verified);
```

### User Roles Table
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'moderator', 'user')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
```

### Workspaces Table
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
```

### User Settings Table
```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  theme VARCHAR(10) DEFAULT 'system',
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
  week_starts_on INTEGER DEFAULT 1,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  compact_mode BOOLEAN DEFAULT FALSE,
  notification_preferences JSONB DEFAULT '{}',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  backup_codes TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_settings_user ON user_settings(user_id);
```

---

## 7. Dependencies

### Production Dependencies

**Core Framework**:
- `express@4.18.2` - Web framework
- `typescript@5.3.3` - Type safety

**Database & ORM**:
- `pg@8.11.3` - PostgreSQL client
- `sequelize@6.35.1` - ORM
- `sequelize-typescript@2.1.6` - TypeScript decorators

**Authentication**:
- `jsonwebtoken@9.0.2` - JWT tokens
- `bcrypt@5.1.1` - Password hashing

**Caching**:
- `ioredis@5.3.2` - Redis client

**Validation**:
- `zod@3.22.4` - Schema validation
- `express-validator@7.0.1` - Request validation

**Security**:
- `helmet@7.1.0` - Security headers
- `cors@2.8.5` - CORS support
- `rate-limiter-flexible@3.0.0` - Rate limiting

**Logging & Monitoring**:
- `winston@3.11.0` - Logging
- `@opentelemetry/sdk-node@0.45.0` - Tracing
- `prom-client@15.0.0` - Metrics

**Documentation**:
- `swagger-jsdoc@6.2.8` - API docs generation
- `swagger-ui-express@5.0.0` - API docs UI

**Utilities**:
- `uuid@9.0.1` - UUID generation
- `dotenv@16.3.1` - Environment variables
- `compression@1.7.4` - Response compression

### Development Dependencies

**Testing**:
- `jest@29.7.0` - Test framework
- `supertest@6.3.3` - HTTP testing
- `ts-jest@29.1.1` - TypeScript for Jest

**Code Quality**:
- `eslint@8.56.0` - Linting
- `prettier@3.1.1` - Code formatting
- `@typescript-eslint/eslint-plugin@6.18.1` - TypeScript linting

**Build Tools**:
- `ts-node@10.9.2` - TypeScript execution
- `ts-node-dev@2.0.0` - Development server
- `tsc-alias@1.8.8` - Path alias resolution

---

## 8. Deployment

### Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3000

# Database
DB_HOST=postgres.example.com
DB_PORT=5432
DB_NAME=devcycle_prod
DB_USER=devcycle_user
DB_PASSWORD=<strong-password>

# JWT (Use strong, randomly generated secrets)
JWT_ACCESS_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>

# Redis
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>

# CORS
CORS_ENABLED=true
CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com

# Observability
ELASTICSEARCH_URL=https://elasticsearch.example.com
JAEGER_ENDPOINT=https://jaeger.example.com/api/traces
LOG_LEVEL=info
```

### Docker Deployment

```bash
# Build image
docker build -t devcycle-api:latest .

# Run container
docker run -d \
  --name devcycle-api \
  -p 3000:3000 \
  --env-file .env.production \
  devcycle-api:latest
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: devcycle-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: devcycle-api
  template:
    metadata:
      labels:
        app: devcycle-api
    spec:
      containers:
      - name: api
        image: devcycle-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: devcycle-secrets
              key: db-host
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health/liveness
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/readiness
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

### Load Balancing (Nginx)

```nginx
upstream api_backend {
    least_conn;
    server api-1:3000 max_fails=3 fail_timeout=30s;
    server api-2:3000 max_fails=3 fail_timeout=30s;
    server api-3:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;
    
    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;
    
    location / {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 9. Monitoring & Observability

### Health Check Endpoints

```bash
# Comprehensive health check
GET /health
Response: { status, timestamp, uptime, checks: { database, redis, memory } }

# Kubernetes liveness probe
GET /health/liveness
Response: { status: "alive" }

# Kubernetes readiness probe
GET /health/readiness
Response: { status: "ready", checks: { database, redis } }
```

### Metrics (Prometheus)

```bash
GET /metrics

# Example metrics:
http_requests_total{method="GET",route="/api/v1/auth/me",status="200"} 1234
http_request_duration_seconds_bucket{method="POST",route="/api/v1/auth/login",le="0.1"} 890
active_connections 42
database_query_duration_seconds{operation="SELECT",table="users"} 0.023
```

### Distributed Tracing (Jaeger)

Traces capture:
- Request ID
- Span duration
- Database queries
- Cache operations
- External API calls
- Error stack traces

### Logging Structure

```json
{
  "level": "info",
  "message": "Request processed",
  "timestamp": "2025-01-01T00:00:00Z",
  "service": "devcycle-api",
  "requestId": "req-uuid",
  "userId": "user-uuid",
  "method": "POST",
  "url": "/api/v1/auth/login",
  "statusCode": 200,
  "duration": 123,
  "ip": "192.168.1.1"
}
```

---

## 10. Best Practices & Recommendations

### Code Style
- Use TypeScript strict mode
- Follow Clean Code principles
- Implement SOLID principles
- Write self-documenting code
- Add JSDoc comments for public APIs

### Testing
- Maintain 80%+ code coverage
- Write tests before fixing bugs
- Use integration tests for critical paths
- Mock external dependencies
- Test error scenarios

### Security
- Never commit secrets to Git
- Use environment variables for config
- Implement defense in depth
- Regular dependency updates
- Security audit quarterly

### Performance
- Enable database query logging in dev
- Monitor slow queries (> 100ms)
- Use database indices appropriately
- Implement caching strategy
- Profile memory usage

### DevOps
- Automate deployments
- Use blue-green deployments
- Implement circuit breakers
- Monitor error rates
- Set up alerts for critical metrics

---

**Last Updated**: December 2025  
**API Version**: 1.0.0  
**Documentation Version**: 1.0.0