# Quick Start Guide

Get your DevCycle API up and running in 5 minutes!

## 🚀 Method 1: Docker (Easiest)

```bash
# 1. Clone the repository
git clone <repository-url>
cd devcycle-api

# 2. Start everything with Docker Compose
docker-compose up -d

# 3. Check if it's running
curl http://localhost:3000/health

# 4. Test the API (sign up)
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "name": "Test User",
    "workspaceName": "Test Workspace"
  }'
```

**Done!** Your API is running at `http://localhost:3000`

---

## 💻 Method 2: Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 15+

### Steps

```bash
# 1. Clone and install
git clone <repository-url>
cd devcycle-api
npm install

# 2. Set up environment
cp .env.example .env

# 3. Edit .env and configure:
#    - Database credentials
#    - JWT secrets (use: openssl rand -base64 64)

# 4. Create database
createdb devcycle_dev

# 5. (Optional) Initialize schema manually
psql -d devcycle_dev -f database/schema.sql

# 6. Start development server
npm run dev
```

**Done!** Your API is running at `http://localhost:3000`

---

## 🧪 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3000/health

# Sign up
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "workspaceName": "My Company"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'

# Get current user (replace TOKEN with your access token)
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman

1. Import `postman_collection.json` into Postman
2. Set the `baseUrl` variable to `http://localhost:3000`
3. Run the "Sign Up" or "Login" request
4. Access token will be automatically saved
5. Try other endpoints!

---

## 🐛 Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Verify connection
psql -U postgres -d devcycle_dev
```

### "Port 3000 already in use"
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change PORT in .env
PORT=3001
```

### "JWT secret too short"
```bash
# Generate strong secrets
openssl rand -base64 64

# Add to .env
JWT_ACCESS_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
```

### Docker: "Connection refused"
```bash
# Check container logs
docker-compose logs api

# Restart containers
docker-compose restart

# Rebuild if needed
docker-compose up --build -d
```

---

## 📚 Next Steps

1. **Read the full README**: `README.md`
2. **Explore the API**: Check available endpoints
3. **Import Postman collection**: Test all endpoints easily
4. **Review the code**: Understand the architecture
5. **Add your features**: Extend the API with new modules

---

## 🆘 Need Help?

- Check `README.md` for detailed documentation
- Open an issue on GitHub
- Email: support@devcycle.com

---

**Happy coding! 🎉**
