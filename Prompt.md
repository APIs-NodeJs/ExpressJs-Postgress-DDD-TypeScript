# 🚀 Enterprise-Grade TypeScript Node.js REST API (Production)

## 🎯 Objective

Generate a **complete, production-ready backend API** using **Node.js + Express + TypeScript + DDD **, following **real-world enterprise standards**.

This is **NOT** a tutorial, demo, or pseudo-code project.

✅ Every file must contain **real, executable TypeScript code**
✅ The project must be **copy–paste runnable**
✅ Architecture must be **scalable, testable, and maintainable**
✅ Business logic must be **framework-agnostic**

---

## 🧱 Core Technology Stack (MANDATORY)

```yaml
Runtime: Node.js 20+ LTS
Language: TypeScript (strict mode enabled)
Framework: Express.js 4.x
Database: PostgreSQL 15+
ORM: Sequelize 6.x (sequelize-typescript preferred)
Authentication: JWT (Access + Refresh Tokens)
Real-time: Socket.IO 4.x
Caching: Redis 7.x
Validation: Zod (preferred) or Joi
Testing: Jest 29.x + Supertest
Documentation: OpenAPI 3.0 (Swagger)
Containerization: Docker + Docker Compose
Linting: ESLint (Airbnb) + Prettier
```

---

## 🏛️ Architecture Principles (NON-NEGOTIABLE)

This project **MUST** follow all principles below:

### 1️⃣ Clean Architecture (Hexagonal)

- Presentation → Application → Domain → Infrastructure
- **No framework imports inside Domain layer**
- Business rules are **pure TypeScript**

### 2️⃣ Domain-Driven Design (DDD)

- Each module is a **bounded context**
- Each module contains:
  - Domain
  - Application
  - Infrastructure
  - Presentation

### 3️⃣ SOLID Principles

- Single Responsibility
- Dependency Inversion
- Interface-based design

### 4️⃣ Repository Pattern

- No direct DB access in use cases
- Repositories are interfaces in Domain
- Implementations live in Infrastructure

### 5️⃣ Dependency Injection

- No `new` inside controllers or use cases
- Central DI container
- Replaceable implementations (testability)

### 6️⃣ Event-Driven Architecture

- Domain events for cross-module communication
- Event Bus abstraction (no direct coupling)

---

## 📁 Project Structure (TypeScript-First)

> **Every file must be `.ts`**
>
> **No JavaScript allowed**

```
src/
├── core/
│   ├── config/
│   ├── infrastructure/
│   ├── middleware/
│   ├── errors/
│   ├── utils/
│   └── bootstrap/
│
├── modules/
│   ├── auth/
│   ├── user/
│   ├── workspace/
│   └── role/
│
├── server.ts
```

✅ **Use path aliases** (`@core`, `@modules`, etc.)
✅ **Strict TypeScript enabled**

---

## 🔐 Security Requirements (STRICT)

The implementation **must include**:

- bcrypt hashing (`≥12 rounds`)
- JWT access tokens (15 min)
- Refresh tokens (7 days, rotation enabled)
- Rate limiting (IP-based)
- Helmet security headers
- CSRF protection for mutations
- Strict CORS whitelist
- Environment-based secrets
- Audit logs for:
  - Login
  - Logout
  - Token refresh
  - Permission checks

---

## 🧪 Testing Standards

### Coverage Requirements

| Type        | Coverage       |
| ----------- | -------------- |
| Unit Tests  | ≥ 80%          |
| Integration | All APIs       |
| E2E         | Critical flows |

### Testing Rules

- Use cases tested **without Express**
- Repositories mocked via interfaces
- No database calls in unit tests

---

## 🐳 Docker Requirements

- PostgreSQL service
- Redis service
- API service
- One-command startup:

```bash
docker-compose up -d
```

---

## 🧠 TypeScript Rules (IMPORTANT)

- `"strict": true`
- No `any`
- No implicit `any`
- Typed request/response objects
- DTOs for all inputs & outputs
- Explicit return types for all public methods

---

## 🚀 Implementation Strategy (MANDATORY ORDER)

### ✅ Phase 1 – Core Infrastructure (START HERE)

Generate **complete TypeScript implementations** for:

1. Express app factory
2. Server bootstrap
3. Sequelize setup
4. Redis client
5. Error system
6. Logger (Winston)
7. JWT utilities
8. Password utilities
9. Global middleware
10. Docker configuration
11. `package.json`
12. `.env.example`
13. `README.md`

⚠️ No auth logic yet — infrastructure only.

---

### ✅ Phase 2 – Authentication Module

Implement full **Auth bounded context**:

- Domain:
  - Entities
  - Value Objects
  - Repository interfaces
  - Domain events

- Application:
  - Register
  - Login
  - Refresh
  - Logout
  - Forgot / Reset password

- Infrastructure:
  - Sequelize models
  - Repositories
  - Migrations

- Presentation:
  - Controllers
  - Routes
  - Validators
  - Auth middleware

- Tests:
  - Unit + integration

---

### ✅ Phase 3 – User Module

- User aggregate root
- Profile management
- Status handling
- Admin listing & search
- Soft delete support

---

### ✅ Phase 4 – Workspace (Multi-Tenancy)

- Workspace isolation
- Membership
- Invitations
- Tenant middleware
- Workspace switching

---

### ✅ Phase 5 – RBAC

- Roles
- Permissions
- Role assignment
- Permission checks
- `requirePermission()` middleware

---

### ✅ Phase 6 – Real-Time (Socket.IO)

- JWT socket authentication
- Workspace rooms
- Event broadcasting
- Domain → Socket event bridge

---

## 📦 Deliverables Checklist

- ✅ TypeScript-only project
- ✅ Strict typing everywhere
- ✅ Production-ready Docker setup
- ✅ Fully implemented auth system
- ✅ Multi-tenant enforcement
- ✅ RBAC protection
- ✅ Socket.IO real-time events
- ✅ Tests passing
- ✅ Swagger docs generated

---

## ❗ Hard Rules (Failure If Violated)

❌ Business logic inside controllers
❌ Framework imports in domain
❌ `any` type usage
❌ Missing validation
❌ Missing tests
❌ Fake or placeholder code

---
