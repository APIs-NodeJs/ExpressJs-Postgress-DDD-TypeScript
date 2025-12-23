# Architecture Documentation

## System Overview

DevCycle API follows **Clean Architecture** principles with clear separation of concerns across four main layers.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │  │   Routes     │  │ Middlewares  │      │
│  │              │  │              │  │              │      │
│  │ - HTTP Logic │  │ - Endpoints  │  │ - Auth       │      │
│  │ - Validation │  │ - Routing    │  │ - Validation │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Use Cases   │  │     DTOs     │  │   Services   │      │
│  │              │  │              │  │              │      │
│  │ - Business   │  │ - Data       │  │ - Workflows  │      │
│  │   Logic      │  │   Transfer   │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Entities   │  │    Value     │  │   Domain     │      │
│  │              │  │   Objects    │  │   Services   │      │
│  │ - User       │  │              │  │              │      │
│  │ - Workspace  │  │ - Email      │  │ - Auth Logic │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Repositories │  │   Database   │  │   Security   │      │
│  │              │  │              │  │              │      │
│  │ - User Repo  │  │ - Sequelize  │  │ - JWT        │      │
│  │ - Workspace  │  │ - PostgreSQL │  │ - Bcrypt     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow

```
1. Client Request
      │
      ▼
2. Security Middleware (CORS, Helmet, Rate Limiting)
      │
      ▼
3. Request ID Generation
      │
      ▼
4. Authentication Middleware (JWT Verification)
      │
      ▼
5. Authorization Middleware (Role/Permission Check)
      │
      ▼
6. Validation Middleware (Zod Schema)
      │
      ▼
7. Controller (HTTP Handling)
      │
      ▼
8. Use Case (Business Logic)
      │
      ▼
9. Domain Service (Business Rules)
      │
      ▼
10. Repository (Data Access)
      │
      ▼
11. Database (PostgreSQL)
      │
      ▼
12. Response Formatting
      │
      ▼
13. Client Response
```

## Module Structure

Each module follows the same organizational pattern:

```
modules/
└── auth/
    ├── application/          # Application logic
    │   ├── use-cases/       # Business use cases
    │   │   ├── SignUpUseCase.ts
    │   │   ├── LoginUseCase.ts
    │   │   └── RefreshTokenUseCase.ts
    │   └── dtos/            # Data transfer objects
    │
    ├── domain/              # Domain logic
    │   ├── entities/        # Business entities
    │   │   ├── User.ts
    │   │   └── Workspace.ts
    │   └── services/        # Domain services
    │
    ├── infrastructure/      # Technical implementation
    │   ├── repositories/    # Data access
    │   │   ├── UserRepository.ts
    │   │   └── WorkspaceRepository.ts
    │   ├── security/        # Security services
    │   │   ├── PasswordHasher.ts
    │   │   └── TokenService.ts
    │   └── validators/      # Input validation
    │       └── authValidators.ts
    │
    └── presentation/        # HTTP layer
        ├── controllers/     # Request handlers
        │   └── AuthController.ts
        └── routes/          # Route definitions
            └── authRoutes.ts
```

## Data Flow Example: User Sign Up

```
1. POST /api/v1/auth/signup
   └── Body: { email, password, name, workspaceName }

2. Security Middleware
   └── CORS check
   └── Rate limiting
   └── Helmet headers

3. Validation Middleware
   └── Zod schema validation
   └── Password requirements

4. AuthController.signup()
   └── Receives validated request
   └── Calls SignUpUseCase

5. SignUpUseCase.execute()
   └── Check if user exists (UserRepository)
   └── Validate password (PasswordHasher)
   └── Hash password (PasswordHasher)
   └── Create Workspace entity
   └── Create User entity
   └── Save to database (Repositories)
   └── Generate JWT tokens (TokenService)
   └── Return Result<SignUpResponse>

6. Controller formats response
   └── Status: 201 Created
   └── Body: { data: { user, tokens } }

7. Response sent to client
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Security Layers                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. NETWORK LAYER                                           │
│     • HTTPS/TLS encryption                                  │
│     • Firewall rules                                        │
│                                                              │
│  2. HTTP LAYER                                              │
│     • Helmet (Security headers)                             │
│     • CORS (Origin control)                                 │
│     • Rate limiting (DDoS protection)                       │
│                                                              │
│  3. AUTHENTICATION LAYER                                    │
│     • JWT tokens (Access + Refresh)                         │
│     • Token expiration                                      │
│     • Token verification                                    │
│                                                              │
│  4. AUTHORIZATION LAYER                                     │
│     • Role-based access control                             │
│     • Permission checks                                     │
│     • Resource ownership validation                         │
│                                                              │
│  5. DATA LAYER                                              │
│     • Input validation (Zod)                                │
│     • SQL injection prevention                              │
│     • XSS protection                                        │
│     • Password hashing (bcrypt)                             │
│                                                              │
│  6. APPLICATION LAYER                                       │
│     • Error handling                                        │
│     • Logging (no sensitive data)                           │
│     • Account lockout                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

```sql
┌─────────────────────┐         ┌─────────────────────┐
│     workspaces      │         │        users        │
├─────────────────────┤         ├─────────────────────┤
│ id (UUID) PK        │◄────┐   │ id (UUID) PK        │
│ name                │     │   │ email (unique)      │
│ owner_id (UUID)     │     └───│ workspace_id FK     │
│ created_at          │         │ password            │
│ updated_at          │         │ name                │
└─────────────────────┘         │ role                │
                                │ email_verified      │
                                │ avatar              │
                                │ created_at          │
                                │ updated_at          │
                                └─────────────────────┘
```

## Dependency Injection Pattern

```typescript
// 1. Create dependencies
const userRepository = new UserRepository();
const passwordHasher = new PasswordHasher();
const tokenService = new TokenService();

// 2. Inject into use case
const signUpUseCase = new SignUpUseCase(
  userRepository,
  workspaceRepository,
  passwordHasher,
  tokenService
);

// 3. Inject into controller
const authController = new AuthController(
  signUpUseCase,
  loginUseCase,
  getCurrentUserUseCase
);

// 4. Use in routes
router.post('/signup', authController.signup);
```

## Error Handling Flow

```
┌─────────────────────┐
│   Try-Catch Block   │
│   in Controller     │
└──────────┬──────────┘
           │
           ▼
    ┌──────────────┐
    │ Error Occurs │
    └──────┬───────┘
           │
           ▼
    ┌─────────────────┐
    │ Is AppError?    │
    └────┬─────┬──────┘
         │     │
    Yes  │     │ No
         │     │
         ▼     ▼
    ┌─────┐ ┌────────────────┐
    │ Use │ │ Create generic │
    │ Code│ │ internal error │
    │ & Msg│ └────────┬───────┘
    └──┬──┘          │
       │             │
       └─────┬───────┘
             │
             ▼
    ┌────────────────────┐
    │ Error Handler      │
    │ Middleware         │
    │ - Format response  │
    │ - Set status code  │
    │ - Add request ID   │
    └─────────┬──────────┘
              │
              ▼
    ┌──────────────────┐
    │ JSON Response    │
    │ {                │
    │   error: {       │
    │     code,        │
    │     message,     │
    │     details,     │
    │     requestId    │
    │   }              │
    │ }                │
    └──────────────────┘
```

## Scalability Considerations

### Horizontal Scaling
- Stateless architecture (JWT tokens)
- No session storage required
- Load balancer ready
- Database connection pooling

### Vertical Scaling
- Efficient database queries
- Indexed database columns
- Connection pooling (max 10)
- Memory-efficient operations

### Caching Strategy
- JWT tokens cached in client
- Rate limit data in memory
- Database query caching (future)

### Performance Optimization
- Async/await for I/O operations
- Database indexes on foreign keys
- Pagination for large datasets
- Request/response compression

## Monitoring & Observability

```
┌────────────────────────────────────────────────────────┐
│                  Monitoring Stack                       │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Health Checks                                         │
│  ├── /health           (Comprehensive)                 │
│  ├── /health/liveness  (Is running?)                   │
│  └── /health/readiness (Can handle traffic?)           │
│                                                         │
│  Logging                                               │
│  ├── Request IDs (Tracing)                            │
│  ├── Error logs (Stack traces)                        │
│  └── Access logs (Requests)                           │
│                                                         │
│  Metrics (Future)                                      │
│  ├── Request count                                     │
│  ├── Response times                                    │
│  ├── Error rates                                       │
│  └── Database connections                              │
│                                                         │
└────────────────────────────────────────────────────────┘
```

## Technology Stack Rationale

| Technology | Why Chosen |
|-----------|-----------|
| **TypeScript** | Type safety, better developer experience, fewer runtime errors |
| **Express** | Mature, flexible, large ecosystem, industry standard |
| **PostgreSQL** | ACID compliance, powerful features, excellent TypeScript support |
| **Sequelize** | Feature-rich ORM, TypeScript support, migrations |
| **JWT** | Stateless, scalable, industry standard |
| **Zod** | Runtime type checking, excellent TypeScript integration |
| **bcrypt** | Industry standard for password hashing, well-tested |

## Design Patterns Used

1. **Clean Architecture** - Separation of concerns, dependency inversion
2. **Repository Pattern** - Data access abstraction
3. **Use Case Pattern** - Business logic encapsulation
4. **Result Pattern** - Elegant error handling
5. **Dependency Injection** - Loose coupling, testability
6. **Middleware Pattern** - Request/response processing pipeline
7. **Factory Pattern** - Entity creation
8. **Strategy Pattern** - Authentication strategies

## Future Enhancements

- [ ] Email verification system
- [ ] Password reset functionality
- [ ] Refresh token rotation
- [ ] Redis for caching
- [ ] Event sourcing
- [ ] CQRS pattern
- [ ] WebSocket support
- [ ] Microservices architecture
- [ ] GraphQL API
- [ ] Advanced monitoring (Prometheus, Grafana)
