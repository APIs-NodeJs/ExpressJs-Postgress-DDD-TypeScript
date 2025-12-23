# DevCycle Backend API

🚀 Enterprise-grade backend API for DevCycle project management platform built with Node.js, TypeScript, Express, and PostgreSQL.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)

## ✨ Features

- ✅ **Clean Architecture** - Domain-Driven Design (DDD) with clear separation of concerns
- ✅ **TypeScript** - Full type safety and modern JavaScript features
- ✅ **Authentication** - JWT-based authentication with refresh tokens
- ✅ **Authorization** - Role-based access control (RBAC)
- ✅ **Caching** - Redis integration for high performance
- ✅ **Security** - Comprehensive security measures (Helmet, CORS, rate limiting, SQL injection protection, XSS protection)
- ✅ **Logging** - Winston for structured logging
- ✅ **API Documentation** - Swagger/OpenAPI documentation
- ✅ **Testing** - Jest for unit and integration tests
- ✅ **Docker** - Containerized for easy deployment
- ✅ **CI/CD** - GitHub Actions workflow
- ✅ **Code Quality** - ESLint and Prettier for consistent code style

## 🛠 Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript 5+
- **Framework:** Express.js
- **Database:** PostgreSQL 15+
- **ORM:** Sequelize with sequelize-typescript
- **Cache:** Redis
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Zod, express-validator
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest, Supertest
- **Logging:** Winston
- **Security:** Helmet, CORS, rate-limiter-flexible

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js >= 20.0.0
- npm >= 9.0.0
- PostgreSQL >= 15
- Redis >= 7
- Docker & Docker Compose (optional, but recommended)

## 🚀 Getting Started

### Option 1: Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/devcycle-backend.git
   cd devcycle-backend
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Check health**
   ```bash
   curl http://localhost:3000/health
   ```

### Option 2: Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/devcycle-backend.git
   cd devcycle-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start PostgreSQL and Redis**
   ```bash
   # Using Docker for databases only
   docker-compose up -d db redis
   ```

5. **Run database migrations**
   ```bash
   npm run migration:run
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Visit the API**
   - API: http://localhost:3000/api/v1
   - Docs: http://localhost:3000/api/docs
   - Health: http://localhost:3000/health

## 📁 Project Structure

```
devcycle-backend/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── validateEnv.ts
│   ├── infrastructure/         # Infrastructure layer
│   │   ├── cache/             # Redis cache
│   │   ├── database/          # Database configuration
│   │   ├── http/              # HTTP layer (middlewares, routes, controllers)
│   │   └── logging/           # Logging configuration
│   ├── modules/               # Feature modules
│   │   ├── auth/              # Authentication module
│   │   │   ├── application/   # Use cases and DTOs
│   │   │   ├── domain/        # Domain entities and repositories
│   │   │   ├── infrastructure/# Persistence and services
│   │   │   └── presentation/  # Controllers and routes
│   │   └── settings/          # User settings module
│   ├── shared/                # Shared domain concepts
│   │   ├── application/       # Shared application logic
│   │   ├── domain/           # Shared domain logic
│   │   └── infrastructure/   # Shared infrastructure
│   ├── app.ts                # Express app configuration
│   └── server.ts             # Server entry point
├── tests/                     # Test files
│   ├── integration/          # Integration tests
│   ├── unit/                 # Unit tests
│   └── setup.ts              # Test setup
├── logs/                      # Log files
├── .github/                   # GitHub Actions workflows
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Docker image definition
├── jest.config.js            # Jest configuration
├── .eslintrc.json            # ESLint configuration
├── .prettierrc.json          # Prettier configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## 📚 API Documentation

### Swagger Documentation

Access the interactive API documentation at:
```
http://localhost:3000/api/docs
```

### Key Endpoints

#### Authentication
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout

#### Health Checks
- `GET /health` - Comprehensive health check
- `GET /health/liveness` - Liveness probe
- `GET /health/readiness` - Readiness probe

## 🧪 Testing

### Run all tests
```bash
npm test
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode
npm run test:watch
```

### Test Structure
```
tests/
├── integration/
│   └── auth.test.ts
├── unit/
│   └── services/
└── setup.ts
```

## 🔒 Security

This application implements multiple security layers:

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (Owner, Admin, Moderator, User)
- Password hashing with bcrypt (12 rounds)

### Security Middleware
- **Helmet** - Secure HTTP headers
- **CORS** - Cross-Origin Resource Sharing
- **Rate Limiting** - IP and user-based rate limiting
- **SQL Injection Protection** - Input sanitization
- **XSS Protection** - Cross-site scripting prevention
- **Request Size Limiting** - Prevent large payload attacks

### Best Practices
- Environment variable validation
- Secure password requirements
- Token expiration and rotation
- Request ID tracking
- Comprehensive error handling
- Input validation with Zod

## 🐳 Docker Commands

```bash
# Build image
npm run docker:build

# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# View logs
npm run docker:logs

# Start with development tools (PgAdmin, Redis Commander)
docker-compose --profile dev up -d
```

## 🔧 Development

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Database Migrations

```bash
# Generate new migration
npm run migration:generate -- migration-name

# Run migrations
npm run migration:run

# Undo last migration
npm run migration:undo
```

## 🚀 Deployment

### Environment Variables

Ensure all required environment variables are set in production:

- `NODE_ENV=production`
- Strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (at least 32 characters)
- Production database credentials
- Redis connection details
- CORS allowed origins

### Production Build

```bash
npm run build
npm start
```

### Docker Production

```bash
docker build -t devcycle-api:latest .
docker run -p 3000:3000 --env-file .env.production devcycle-api:latest
```

## 📊 Monitoring

### Health Endpoints

Monitor your application health:

```bash
# Basic health
curl http://localhost:3000/health

# Liveness probe (for Kubernetes)
curl http://localhost:3000/health/liveness

# Readiness probe (for Kubernetes)
curl http://localhost:3000/health/readiness
```

### Logs

Logs are stored in the `logs/` directory:
- `error.log` - Error logs
- `combined.log` - All logs
- `warn.log` - Warning logs

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Clean Architecture by Robert C. Martin
- Domain-Driven Design by Eric Evans
- The Node.js and TypeScript communities

---

Made with ❤️ by the DevCycle Team