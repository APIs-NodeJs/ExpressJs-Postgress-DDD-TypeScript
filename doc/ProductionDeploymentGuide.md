# Production Deployment Guide

## 🎯 Overview

This guide covers deploying the Devcycle API to production environments with security best practices.

---

## 📋 Pre-Deployment Checklist

### Security

- [ ] Generate strong JWT secrets (min 32 characters, use crypto.randomBytes)
- [ ] Set strong database password (min 16 characters)
- [ ] Configure CORS with specific allowed origins
- [ ] Enable SSL/TLS for database connections
- [ ] Set up HTTPS for API endpoints
- [ ] Review and adjust rate limiting thresholds
- [ ] Disable development features (sync, detailed logs)

### Infrastructure

- [ ] PostgreSQL 15+ database provisioned
- [ ] Node.js 18+ runtime environment
- [ ] Reverse proxy configured (nginx/Apache)
- [ ] SSL certificates obtained (Let's Encrypt)
- [ ] Process manager installed (PM2)
- [ ] Monitoring solution set up
- [ ] Log aggregation configured

### Environment

- [ ] All environment variables configured
- [ ] NODE_ENV set to "production"
- [ ] Database migrations ready
- [ ] Backup strategy in place

---

## 🔐 Generating Secure Secrets

### JWT Secrets

```bash
# Generate JWT_ACCESS_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET (must be different)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important**: Store these in a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)

---

## 🗄️ Database Setup

### 1. Create Production Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE devcycle_production;

# Create user
CREATE USER devcycle_user WITH ENCRYPTED PASSWORD 'your_strong_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE devcycle_production TO devcycle_user;

# Exit
\q
```

### 2. Run Migrations

```bash
# Apply schema
psql -U devcycle_user -d devcycle_production < database/schema.sql

# Or use migration tool
npm run db:migrate
```

### 3. Enable SSL

Add to your PostgreSQL `postgresql.conf`:

```
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
```

Update connection string in `.env`:

```bash
DB_SSL=true
```

---

## 🐳 Docker Deployment

### Production Dockerfile

Create `Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built files
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

USER nodejs

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### Docker Compose for Production

Create `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: devcycle-api
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
    env_file:
      - .env.production
    depends_on:
      - postgres
    networks:
      - devcycle-network
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  postgres:
    image: postgres:15-alpine
    container_name: devcycle-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    networks:
      - devcycle-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  devcycle-network:
    driver: bridge

volumes:
  postgres_data:
```

### Deploy with Docker

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f api

# Stop
docker-compose -f docker-compose.prod.yml down
```

---

## 🚀 PM2 Deployment (Traditional)

### Install PM2

```bash
npm install -g pm2
```

### PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "devcycle-api",
      script: "./dist/server.js",
      instances: 4,
      exec_mode: "cluster",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      max_memory_restart: "500M",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
```

### Deploy

```bash
# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# Monitor
pm2 monit

# View logs
pm2 logs devcycle-api

# Restart
pm2 restart devcycle-api

# Stop
pm2 stop devcycle-api
```

---

## 🌐 Nginx Configuration

### Reverse Proxy Setup

Create `/etc/nginx/sites-available/devcycle-api`:

```nginx
upstream api_backend {
    least_conn;
    server 127.0.0.1:3000;
    # Add more servers for load balancing
    # server 127.0.0.1:3001;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/api_access.log;
    error_log /var/log/nginx/api_error.log;

    # Max body size
    client_max_body_size 10M;

    location / {
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;

        # Proxy settings
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no rate limit)
    location /health {
        proxy_pass http://api_backend/health;
        access_log off;
    }
}
```

### Enable Site

```bash
# Link configuration
sudo ln -s /etc/nginx/sites-available/devcycle-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal (add to crontab)
0 0 * * * certbot renew --quiet
```

---

## 📊 Monitoring & Logging

### Health Check Monitoring

Use a service like UptimeRobot, Pingdom, or custom script:

```bash
#!/bin/bash
# health_check.sh

URL="https://api.yourdomain.com/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -eq 200 ]; then
    echo "API is healthy"
    exit 0
else
    echo "API is down! Status: $RESPONSE"
    # Send alert (email, Slack, etc.)
    exit 1
fi
```

### Log Rotation

Create `/etc/logrotate.d/devcycle-api`:

```
/app/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nodejs nodejs
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Application Monitoring

Consider integrating:

- **APM**: New Relic, Datadog, or AppDynamics
- **Error Tracking**: Sentry
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /app/devcycle-api
            git pull origin main
            npm ci
            npm run build
            pm2 restart devcycle-api
```

---

## 🔒 Security Hardening

### Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow PostgreSQL (if external)
sudo ufw allow from trusted_ip to any port 5432

# Enable firewall
sudo ufw enable
```

### Database Security

```sql
-- Revoke public access
REVOKE ALL ON DATABASE devcycle_production FROM PUBLIC;

-- Grant specific permissions
GRANT CONNECT ON DATABASE devcycle_production TO devcycle_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO devcycle_user;
```

### Environment Variables

Never commit `.env` files. Use:

- AWS Secrets Manager
- HashiCorp Vault
- Docker secrets
- Kubernetes secrets

---

## 🚨 Disaster Recovery

### Database Backups

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="devcycle_production"

# Create backup
pg_dump -U devcycle_user -d $DB_NAME | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$TIMESTAMP.sql.gz s3://your-bucket/backups/
```

### Restore Database

```bash
# Decompress and restore
gunzip -c backup_20250125_120000.sql.gz | psql -U devcycle_user -d devcycle_production
```

---

## 📈 Scaling Considerations

### Horizontal Scaling

- Run multiple API instances behind load balancer
- Use Redis for shared session storage
- Implement database read replicas

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement caching layer

### Database Optimization

- Add appropriate indexes
- Use connection pooling
- Implement query caching
- Consider read replicas

---

## ✅ Post-Deployment Verification

```bash
# 1. Check API health
curl https://api.yourdomain.com/health

# 2. Test authentication
curl -X POST https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 3. Monitor logs
pm2 logs devcycle-api --lines 100

# 4. Check SSL
curl -I https://api.yourdomain.com

# 5. Verify CORS
curl -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS https://api.yourdomain.com/api/v1/auth/login -v
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

- [ ] Review and rotate logs weekly
- [ ] Update dependencies monthly
- [ ] Review security patches weekly
- [ ] Monitor error rates daily
- [ ] Test backups monthly
- [ ] Review API usage patterns weekly

### Troubleshooting

**API not responding:**

```bash
pm2 restart devcycle-api
sudo systemctl status nginx
sudo systemctl status postgresql
```

**Database connection issues:**

```bash
psql -U devcycle_user -d devcycle_production
# Check pg_hba.conf settings
```

**High memory usage:**

```bash
pm2 restart devcycle-api
# Adjust max_memory_restart in ecosystem.config.js
```

---

**Deployment Version**: 1.0.0  
**Last Updated**: December 2025
