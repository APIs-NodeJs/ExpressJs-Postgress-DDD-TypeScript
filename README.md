# Devcycle API

Express + TypeScript + Sequelize + PostgreSQL boilerplate with authentication.

Quick start:

```bash
npm install
cp .env.example .env
# edit .env
docker-compose up -d postgres
npm run dev
```

API endpoints:
- POST /api/v1/auth/signup
- POST /api/v1/auth/login
- GET  /api/v1/auth/me (requires Bearer token)
- GET  /health
