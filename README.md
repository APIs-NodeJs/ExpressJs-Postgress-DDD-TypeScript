# DDD Backend Core API - Complete Documentation

## 🎯 Overview

A production-ready, enterprise-grade backend API built with:

- **Domain-Driven Design (DDD)** architecture
- **Clean Architecture** principles
- **SOLID** design patterns
- **TypeScript** for type safety
- **Express.js** framework
- **PostgreSQL** database with Sequelize ORM
- **JWT-based authentication**
- **Google OAuth 2.0 integration**
- **Role-based access control (RBAC)**
- **Workspace & organization management**

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Getting Started](#getting-started)
3. [Authentication & Authorization](#authentication--authorization)
4. [API Endpoints](#api-endpoints)
5. [Security Features](#security-features)
6. [Testing](#testing)
7. [Deployment](#deployment)

---

## 🏗️ Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Controllers, Routes, DTOs, Validators)│
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Application Layer               │
│    (Use Cases, Commands, Queries)       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           Domain Layer                  │
│ (Entities, Value Objects, Aggregates,   │
│  Domain Events, Domain Services)        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       Infrastructure Layer              │
│ (Repositories, Database, External APIs) │
└─────────────────────────────────────────┘
```

### Key Design Patterns

- **Aggregate Root Pattern**: Workspace and User entities
- **Repository Pattern**: Data access abstraction
- **Unit of Work Pattern**: Transaction management
- **Result Pattern**: Functional error handling
- **Domain Events**: Decoupled domain logic
- **Value Objects**: Email, WorkspaceRole, Permission
- **Factory Pattern**: Entity creation
- **Strategy Pattern**: Authentication providers

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js >= 18.0.0
PostgreSQL >= 13
npm or yarn
```

### Installation

1. **Clone and install dependencies**:

```bash
git clone <repository-url>
cd ddd-backend-core
npm install
```

2. **Configure environment variables**:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_dev
DB_USER=postgres
DB_PASSWORD=your_password

# JWT (Generate strong secrets!)
JWT_SECRET=your-32-char-minimum-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-32-char-refresh-secret-here
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info
```

3. **Setup database**:

```bash
# Create database
createdb myapp_dev

# Run migrations (use migration tool or execute SQL)
psql -d myapp_dev -f database/migrations/001-create-users-table.sql
```

4. **Start development server**:

```bash
npm run dev
```

Server will start on `http://localhost:3000`

---

## 🔐 Authentication & Authorization

### Authentication Methods

#### 1. Email/Password Authentication

**Register**:

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "User registered successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Login**:

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### 2. Google OAuth Authentication

**Get Authorization URL**:

```bash
GET /api/v1/auth/google

Response:
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
    "state": "random-state-string"
  }
}
```

**Exchange Code for Tokens**:

```bash
POST /api/v1/auth/google/callback
Content-Type: application/json

{
  "code": "authorization-code-from-google"
}
```

**Refresh Token**:

```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&\*(),.?":{}|<>)

### JWT Token Structure

**Access Token** (15 min expiry):

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "USER",
  "workspaceId": "uuid (optional)",
  "iat": 1234567890,
  "exp": 1234568790,
  "iss": "ddd-core-api",
  "aud": "ddd-core-client"
}
```

**Refresh Token** (7 days expiry):

```json
{
  "userId": "uuid",
  "tokenVersion": 1,
  "iat": 1234567890,
  "exp": 1235172690
}
```

### Authorization Levels

#### System Roles

- **USER**: Standard user access
- **MODERATOR**: Content moderation capabilities
- **ADMIN**: System administration access

#### Workspace Roles

- **OWNER**: Full workspace control
- **ADMIN**: Manage members and settings
- **MEMBER**: Create and edit content
- **VIEWER**: Read-only access

#### Workspace Permissions

```typescript
enum Permission {
  WORKSPACE_UPDATE = 'WORKSPACE_UPDATE',
  WORKSPACE_DELETE = 'WORKSPACE_DELETE',
  MEMBER_INVITE = 'MEMBER_INVITE',
  MEMBER_REMOVE = 'MEMBER_REMOVE',
  MEMBER_UPDATE_ROLE = 'MEMBER_UPDATE_ROLE',
  CONTENT_CREATE = 'CONTENT_CREATE',
  CONTENT_READ = 'CONTENT_READ',
  CONTENT_UPDATE = 'CONTENT_UPDATE',
  CONTENT_DELETE = 'CONTENT_DELETE',
  SETTINGS_VIEW = 'SETTINGS_VIEW',
  SETTINGS_UPDATE = 'SETTINGS_UPDATE',
}
```

---

## 📡 API Endpoints

### Health Check

```bash
GET /api/v1/health
# Check service health

GET /api/v1/health/readiness
# Check service readiness
```

### Authentication Endpoints

| Method | Endpoint                | Description               | Auth Required |
| ------ | ----------------------- | ------------------------- | ------------- |
| POST   | `/auth/register`        | Register new user         | ❌            |
| POST   | `/auth/login`           | Login with email/password | ❌            |
| GET    | `/auth/google`          | Get Google OAuth URL      | ❌            |
| POST   | `/auth/google/callback` | Google OAuth callback     | ❌            |
| POST   | `/auth/refresh`         | Refresh access token      | ❌            |
| POST   | `/auth/logout`          | Logout user               | ✅            |

### Workspace Endpoints

| Method | Endpoint                          | Description           | Auth Required | Permissions |
| ------ | --------------------------------- | --------------------- | ------------- | ----------- |
| POST   | `/workspaces`                     | Create workspace      | ✅            | -           |
| GET    | `/workspaces/my-workspaces`       | Get user's workspaces | ✅            | -           |
| GET    | `/workspaces/:id`                 | Get workspace details | ✅            | Member      |
| POST   | `/workspaces/:id/members`         | Add member            | ✅            | OWNER/ADMIN |
| DELETE | `/workspaces/:id/members/:userId` | Remove member         | ✅            | OWNER/ADMIN |

### Request Examples

#### Create Workspace

```bash
POST /api/v1/workspaces
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "My Awesome Project",
  "description": "A project description"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": "workspace-uuid",
      "name": "My Awesome Project",
      "slug": "my-awesome-project",
      "ownerId": "user-uuid",
      "description": "A project description"
    }
  },
  "message": "Workspace created successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Add Member to Workspace

```bash
POST /api/v1/workspaces/:workspaceId/members
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "userId": "user-uuid",
  "role": "MEMBER"
}
```

#### Get My Workspaces

```bash
GET /api/v1/workspaces/my-workspaces
Authorization: Bearer <access_token>
```

**Response**:

```json
{
  "success": true,
  "data": {
    "workspaces": [
      {
        "id": "workspace-uuid",
        "name": "My Awesome Project",
        "slug": "my-awesome-project",
        "ownerId": "user-uuid",
        "isOwner": true,
        "memberCount": 5,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "message": "Workspaces retrieved successfully"
}
```

---

## 🔒 Security Features

### Implemented Security Measures

1. **Password Security**
   - Bcrypt hashing with 12 salt rounds
   - Strong password policy enforcement
   - No plain-text password storage

2. **JWT Security**
   - Short-lived access tokens (15 min)
   - Refresh token rotation
   - Token revocation support
   - Signed with HS256 algorithm

3. **HTTP Security Headers** (via Helmet.js)
   - Content Security Policy (CSP)
   - X-Frame-Options
   - X-Content-Type-Options
   - Strict-Transport-Security

4. **CORS Protection**
   - Configurable allowed origins
   - Credential support
   - Preflight request handling

5. **Rate Limiting**
   - 200 requests per minute per IP (configurable)
   - Prevents brute force attacks
   - DDoS mitigation

6. **Input Validation**
   - Zod schema validation
   - SQL injection prevention (Sequelize parameterization)
   - XSS protection

7. **Request Sanitization**
   - Sensitive field redaction in logs
   - Request size limits (10MB)

8. **Error Handling**
   - No stack traces in production
   - Generic error messages
   - Detailed logging for debugging

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/
│   ├── modules/
│   │   ├── users/
│   │   │   └── domain/
│   │   │       └── User.spec.ts
│   │   └── workspaces/
│   │       └── domain/
│   │           └── Workspace.spec.ts
│   └── core/
│       └── domain/
│           └── Result.spec.ts
└── integration/
    ├── auth.api.spec.ts
    └── workspace.api.spec.ts
```

### Example Test

```typescript
describe('RegisterUserUseCase', () => {
  it('should register a new user successfully', async () => {
    // Arrange
    const request = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    // Act
    const result = await registerUserUseCase.execute(request);

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(result.getValue().user.email).toBe('test@example.com');
    expect(result.getValue().accessToken).toBeDefined();
  });
});
```

---

## 🚢 Deployment

### Docker Deployment

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment-Specific Configuration

**Development**:

```env
NODE_ENV=development
LOG_LEVEL=debug
```

**Production**:

```env
NODE_ENV=production
LOG_LEVEL=warn
# Use strong, randomly generated secrets
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>
```

### Production Checklist

- [ ] Set strong JWT secrets (64+ characters)
- [ ] Configure production database credentials
- [ ] Enable SSL/TLS for database connections
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Set up monitoring (e.g., Sentry, DataDog)
- [ ] Enable database backups
- [ ] Set up CI/CD pipeline
- [ ] Configure health checks
- [ ] Review and update security headers
- [ ] Set up log aggregation
- [ ] Configure auto-scaling

### Performance Recommendations

1. **Database Optimization**
   - Add indexes on frequently queried columns
   - Use connection pooling
   - Enable query caching

2. **Caching Strategy**
   - Implement Redis for session storage
   - Cache frequently accessed data
   - Use CDN for static assets

3. **Load Balancing**
   - Use Nginx or HAProxy
   - Enable sticky sessions for WebSocket
   - Horizontal scaling with multiple instances

---

## 📊 Monitoring & Logging

### Structured Logging

All logs follow JSON format:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "INFO",
  "context": "UserRepository",
  "message": "User created successfully",
  "meta": {
    "userId": "uuid",
    "email": "user@example.com"
  }
}
```

### Log Levels

- **DEBUG**: Detailed diagnostic information
- **INFO**: General informational messages
- **WARN**: Warning messages
- **ERROR**: Error messages

### Request Tracking

Each request is assigned a unique `requestId` for end-to-end tracking:

```json
{
  "requestId": "uuid",
  "method": "POST",
  "path": "/api/v1/workspaces",
  "statusCode": 201,
  "duration": "45ms"
}
```

---

## 🤝 Contributing

1. Follow the DDD architecture patterns
2. Write tests for new features
3. Use TypeScript strict mode
4. Follow ESLint and Prettier configurations
5. Update documentation
6. Create meaningful commit messages

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Support

For issues and questions:

- Create an issue in the repository
- Check existing documentation
- Review the codebase examples

---

## 📚 Additional Resources

- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
