# DDD Backend Core Infrastructure

A production-ready backend infrastructure following Domain-Driven Design (DDD) principles, Clean Architecture, and SOLID principles.

## 🏗️ Architecture

This project implements a layered architecture:

```
src/
├── core/                    # DDD Core Building Blocks
│   ├── domain/             # Domain layer (Entities, Value Objects, Aggregates)
│   ├── application/        # Application layer (Use Cases, Commands, Queries)
│   ├── infrastructure/     # Infrastructure layer (Persistence, Messaging)
│   └── utils/              # Core utilities
├── shared/                 # Shared utilities across all modules
│   ├── config/            # Configuration management
│   ├── errors/            # Error handling
│   ├── middlewares/       # Express middlewares
│   ├── responses/         # Standardized API responses
│   ├── types/             # Shared TypeScript types
│   └── utils/             # Shared utilities
├── modules/               # Domain modules (to be implemented)
└── api/                   # API routes and controllers
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 13
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`

5. Start the development server:
```bash
npm run dev
```

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Type check without emitting files

## 🏛️ Core Concepts

### Domain Layer

- **Entity**: Objects with unique identity
- **Value Object**: Immutable objects without identity
- **Aggregate Root**: Entity that acts as consistency boundary
- **Domain Event**: Something that happened in the domain
- **Result**: Functional error handling pattern

### Application Layer

- **Use Case**: Application-specific business rules
- **Command**: Write operations
- **Query**: Read operations
- **Repository Interface**: Abstract data access
- **Unit of Work**: Transaction management

### Infrastructure Layer

- **Repository Implementation**: Concrete data access
- **Event Publisher**: Domain event distribution
- **Unit of Work Implementation**: Transaction handling
- **Mappers**: Convert between domain and persistence models

## 🔧 Key Features

### Error Handling

Centralized error handling with custom error types:
- `ValidationError` - Input validation failures
- `NotFoundError` - Resource not found
- `UnauthorizedError` - Authentication required
- `ForbiddenError` - Insufficient permissions
- `ConflictError` - Resource conflicts
- `InternalServerError` - Unexpected errors

### API Response Format

Standardized response format for consistency:

**Success Response:**
```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "meta": {},
  "requestId": "uuid",
  "timestamp": "ISO-8601"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {}
  },
  "requestId": "uuid",
  "timestamp": "ISO-8601"
}
```

### Security

- Helmet.js for HTTP headers security
- CORS configuration
- Rate limiting
- Request sanitization
- Input validation with Zod

### Logging

Structured JSON logging with levels:
- DEBUG - Detailed diagnostic information
- INFO - General informational messages
- WARN - Warning messages
- ERROR - Error messages

### Database

- Sequelize ORM with PostgreSQL
- Connection pooling
- Transaction support via Unit of Work pattern
- Migration support

## 🧪 Testing

Tests should follow the Arrange-Act-Assert pattern:

```typescript
describe('UseCase', () => {
  it('should handle success case', async () => {
    // Arrange
    const input = {};
    
    // Act
    const result = await useCase.execute(input);
    
    // Assert
    expect(result.isSuccess).toBe(true);
  });
});
```

## 📦 Adding New Modules

To add a new domain module:

1. Create module structure:
```
src/modules/your-module/
├── domain/
│   ├── entities/
│   ├── valueObjects/
│   └── events/
├── application/
│   ├── useCases/
│   ├── commands/
│   └── queries/
├── infrastructure/
│   ├── persistence/
│   └── mappers/
└── presentation/
    ├── routes/
    ├── controllers/
    └── dto/
```

2. Implement domain logic in `domain/`
3. Implement use cases in `application/`
4. Implement persistence in `infrastructure/`
5. Add API endpoints in `presentation/`

## 🔐 Environment Variables

Required environment variables:

- `NODE_ENV` - Application environment (development/production/test)
- `PORT` - Server port
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `ALLOWED_ORIGINS` - CORS allowed origins
- `LOG_LEVEL` - Logging level (debug/info/warn/error)

## 🤝 Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Follow TypeScript best practices
4. Use meaningful commit messages
5. Update documentation as needed

## 📄 License

MIT

## 🙏 Acknowledgments

Built with:
- Express.js
- TypeScript
- Sequelize
- PostgreSQL
- Zod
- Jest