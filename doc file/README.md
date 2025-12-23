# DevCycle API

A production-ready RESTful API built with Node.js, Express, TypeScript, and PostgreSQL. Features JWT authentication, role-based access control, and clean architecture principles.

## 🌟 Features

- ✅ **Clean Architecture** - DDD principles with clear separation of concerns
- ✅ **Type Safety** - Full TypeScript implementation
- ✅ **Authentication** - JWT-based auth with refresh tokens
- ✅ **Authorization** - Role-based access control (RBAC)
- ✅ **Security** - Rate limiting, helmet, CORS, password hashing
- ✅ **Validation** - Zod schema validation
- ✅ **Database** - PostgreSQL with Sequelize ORM
- ✅ **Docker** - Full containerization support
- ✅ **Error Handling** - Centralized error handling
- ✅ **Health Checks** - Kubernetes-ready health endpoints

## 📋 Prerequisites

- Node.js 20+ ([Download](https://nodejs.org/))
- PostgreSQL 15+ ([Download](https://www.postgresql.org/))
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd devcycle-api

# Start with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f api

# API will be available at http://localhost:3000
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Create database
createdb devcycle_dev

# Start development server
npm run dev

# API will be available at http://localhost:3000
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_NAME=devcycle_dev
DB_USER=postgres
DB_PASSWORD=your_password
DB_PORT=5432

# JWT (Generate: openssl rand -base64 64)
JWT_ACCESS_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:8080

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📚 API Documentation

### Base URL
```
Development: http://localhost:3000
Production: https://api.yourdomain.com
```

### Authentication Endpoints

#### Sign Up
```bash
POST /api/v1/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "workspaceName": "My Company"
}
```

#### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Get Current User
```bash
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

#### Refresh Token
```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

#### Logout
```bash
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

### Health Check Endpoints

```bash
# Comprehensive health check
GET /health

# Liveness probe
GET /health/liveness

# Readiness probe
GET /health/readiness
```

## 🏗️ Project Structure

```
devcycle-api/
├── src/
│   ├── config/              # Configuration files
│   │   ├── constants.ts     # App constants
│   │   ├── database.ts      # Database config
│   │   └── env.ts           # Environment validation
│   │
│   ├── modules/             # Feature modules
│   │   └── auth/
│   │       ├── application/ # Use cases & DTOs
│   │       ├── domain/      # Entities & business logic
│   │       ├── infrastructure/ # Data access & security
│   │       └── presentation/ # Controllers & routes
│   │
│   ├── shared/              # Shared utilities
│   │   ├── application/     # Result pattern, UseCase base
│   │   └── domain/          # AppError, base entities
│   │
│   ├── infrastructure/      # Global infrastructure
│   │   ├── database/        # Database models
│   │   └── http/            # Express setup, middleware
│   │
│   ├── app.ts              # Express app setup
│   └── server.ts           # Server entry point
│
├── .env.example            # Environment template
├── docker-compose.yml      # Docker orchestration
├── Dockerfile              # Container definition
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript config
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Tokens**: Separate access and refresh tokens
- **Rate Limiting**: 100 requests per minute per IP
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Helmet middleware
- **CORS**: Configurable allowed origins

## 📊 Role-Based Access Control

Available roles:
- **Owner**: Full system access
- **Admin**: All except CORS management
- **Moderator**: Limited administrative access
- **User**: Standard access (default)

## 🚢 Deployment

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

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong JWT secrets (64+ characters)
- [ ] Configure PostgreSQL with proper credentials
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and logging
- [ ] Enable database backups
- [ ] Configure rate limiting appropriately

## 🛠️ Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm test            # Run tests
npm run lint        # Lint code
npm run format      # Format code with Prettier
```

## 📝 API Response Format

### Success Response
```json
{
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {
      "field": ["Error message"]
    },
    "requestId": "request-uuid"
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues or questions:
- Open a GitHub issue
- Email: support@devcycle.com

## 🔄 Changelog

### Version 1.0.0 (2025-01-01)
- Initial release
- JWT authentication
- User management
- Workspace support
- Role-based access control
- Health check endpoints

---

Made with ❤️ by the DevCycle team
