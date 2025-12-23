# Deployment Guide

Complete guide for deploying DevCycle API to production environments.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [AWS Deployment](#aws-deployment)
5. [Database Setup](#database-setup)
6. [Environment Configuration](#environment-configuration)
7. [SSL/TLS Setup](#ssltls-setup)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

- [ ] Generate strong JWT secrets (64+ characters)
- [ ] Set up production database (PostgreSQL 15+)
- [ ] Configure environment variables
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Review security settings
- [ ] Test all endpoints
- [ ] Load testing completed
- [ ] Documentation updated

---

## Docker Deployment

### 1. Build Production Image

```bash
# Clone repository
git clone <repository-url>
cd devcycle-api

# Build Docker image
docker build -t devcycle-api:1.0.0 .

# Tag for registry
docker tag devcycle-api:1.0.0 your-registry.com/devcycle-api:1.0.0

# Push to registry
docker push your-registry.com/devcycle-api:1.0.0
```

### 2. Run Container

```bash
# Create production environment file
cat > .env.production << EOF
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host
DB_NAME=devcycle_prod
DB_USER=devcycle_user
DB_PASSWORD=your-secure-password
DB_PORT=5432
JWT_ACCESS_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
EOF

# Run container
docker run -d \
  --name devcycle-api \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  --memory 512m \
  --cpus 1 \
  devcycle-api:1.0.0

# Check logs
docker logs -f devcycle-api
```

### 3. Docker Compose (Production)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: devcycle_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: devcycle_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devcycle_user"]
      interval: 30s
      timeout: 10s
      retries: 3

  api:
    image: your-registry.com/devcycle-api:1.0.0
    depends_on:
      postgres:
        condition: service_healthy
    env_file:
      - .env.production
    ports:
      - "3000:3000"
    restart: always
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    restart: always

volumes:
  postgres_data:
```

```bash
# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

---

## Kubernetes Deployment

### 1. Create Namespace

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: devcycle
```

```bash
kubectl apply -f namespace.yaml
```

### 2. Create Secrets

```bash
# Generate secrets
kubectl create secret generic devcycle-secrets \
  --from-literal=jwt-access-secret=$(openssl rand -base64 64) \
  --from-literal=jwt-refresh-secret=$(openssl rand -base64 64) \
  --from-literal=db-password=your-secure-password \
  -n devcycle
```

### 3. Create ConfigMap

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: devcycle-config
  namespace: devcycle
data:
  NODE_ENV: "production"
  PORT: "3000"
  DB_HOST: "postgres-service"
  DB_NAME: "devcycle_prod"
  DB_USER: "devcycle_user"
  DB_PORT: "5432"
  JWT_ACCESS_EXPIRES_IN: "1h"
  JWT_REFRESH_EXPIRES_IN: "7d"
  ALLOWED_ORIGINS: "https://yourdomain.com"
  RATE_LIMIT_WINDOW_MS: "60000"
  RATE_LIMIT_MAX_REQUESTS: "100"
  LOG_LEVEL: "info"
```

### 4. Deploy PostgreSQL

```yaml
# postgres.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: devcycle
spec:
  serviceName: postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_USER
          valueFrom:
            configMapKeyRef:
              name: devcycle-config
              key: DB_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: devcycle-secrets
              key: db-password
        - name: POSTGRES_DB
          valueFrom:
            configMapKeyRef:
              name: devcycle-config
              key: DB_NAME
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: devcycle
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  clusterIP: None
```

### 5. Deploy API

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: devcycle-api
  namespace: devcycle
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
        image: your-registry.com/devcycle-api:1.0.0
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: devcycle-config
        env:
        - name: JWT_ACCESS_SECRET
          valueFrom:
            secretKeyRef:
              name: devcycle-secrets
              key: jwt-access-secret
        - name: JWT_REFRESH_SECRET
          valueFrom:
            secretKeyRef:
              name: devcycle-secrets
              key: jwt-refresh-secret
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: devcycle-secrets
              key: db-password
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
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: devcycle-api-service
  namespace: devcycle
spec:
  selector:
    app: devcycle-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 6. Deploy

```bash
kubectl apply -f configmap.yaml
kubectl apply -f postgres.yaml
kubectl apply -f deployment.yaml

# Check status
kubectl get pods -n devcycle
kubectl get services -n devcycle

# View logs
kubectl logs -f deployment/devcycle-api -n devcycle
```

---

## AWS Deployment

### Option 1: ECS (Elastic Container Service)

1. **Create ECR Repository**
```bash
aws ecr create-repository --repository-name devcycle-api

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag devcycle-api:1.0.0 your-account.dkr.ecr.us-east-1.amazonaws.com/devcycle-api:1.0.0
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/devcycle-api:1.0.0
```

2. **Create RDS PostgreSQL**
- Launch PostgreSQL 15 instance
- Configure security groups
- Note connection details

3. **Create ECS Cluster**
- Create cluster with Fargate
- Configure task definition
- Set environment variables
- Configure load balancer

### Option 2: EC2

```bash
# Connect to EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Pull and run
docker pull your-registry.com/devcycle-api:1.0.0
docker run -d --env-file .env.production -p 3000:3000 devcycle-api:1.0.0
```

---

## Database Setup

### Create Production Database

```bash
# Connect to PostgreSQL
psql -h your-db-host -U postgres

# Create database and user
CREATE DATABASE devcycle_prod;
CREATE USER devcycle_user WITH ENCRYPTED PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE devcycle_prod TO devcycle_user;

# Connect to new database
\c devcycle_prod

# Run schema
\i /path/to/database/schema.sql
```

### Database Migrations

```bash
# Run migrations (if using)
npm run migration:run
```

---

## Environment Configuration

### Generate Secure Secrets

```bash
# JWT secrets (64 characters minimum)
openssl rand -base64 64

# Or use
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Production .env Template

```env
NODE_ENV=production
PORT=3000

# Database
DB_HOST=your-production-db.rds.amazonaws.com
DB_NAME=devcycle_prod
DB_USER=devcycle_user
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE
DB_PORT=5432

# JWT (CHANGE THESE!)
JWT_ACCESS_SECRET=YOUR_64_CHAR_SECRET_HERE
JWT_REFRESH_SECRET=YOUR_64_CHAR_SECRET_HERE
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS (Your production domains)
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

---

## SSL/TLS Setup

### Using Let's Encrypt (Nginx)

```nginx
# /etc/nginx/sites-available/devcycle
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Monitoring & Logging

### Health Check Monitoring

```bash
# Set up health check cron job
cat > /etc/cron.d/api-health << EOF
*/5 * * * * curl -f http://localhost:3000/health || /path/to/alert-script.sh
EOF
```

### Log Aggregation

```yaml
# docker-compose with logging
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Prometheus Metrics (Future)

```yaml
# Add to docker-compose
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
```

---

## Backup & Recovery

### Database Backup

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="devcycle_prod"

# Create backup
pg_dump -h your-db-host -U devcycle_user $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-backup-bucket/
```

```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

### Restore Database

```bash
# Restore from backup
gunzip -c backup_20250101_020000.sql.gz | psql -h your-db-host -U devcycle_user devcycle_prod
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs devcycle-api

# Common issues:
# - Database not accessible
# - Missing environment variables
# - Port already in use
```

### Database Connection Issues

```bash
# Test connection
psql -h your-db-host -U devcycle_user -d devcycle_prod

# Check firewall rules
telnet your-db-host 5432
```

### High Memory Usage

```bash
# Check container stats
docker stats devcycle-api

# Restart container
docker restart devcycle-api
```

### Slow Performance

```bash
# Check database connections
docker exec devcycle-api node -e "
  require('./dist/config/database').sequelize.query('SELECT count(*) FROM pg_stat_activity')
    .then(result => console.log('Active connections:', result[0][0].count))
"

# Add indexes if needed
```

---

## Production Checklist

### Security
- [ ] HTTPS enabled
- [ ] Strong JWT secrets (64+ chars)
- [ ] Database passwords secure
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Firewall rules configured
- [ ] Regular security updates

### Performance
- [ ] Database indexes added
- [ ] Connection pooling configured
- [ ] Caching enabled (if applicable)
- [ ] Load balancer configured
- [ ] CDN for static assets (future)

### Monitoring
- [ ] Health checks configured
- [ ] Logging enabled
- [ ] Alerts set up
- [ ] Backup automated
- [ ] Uptime monitoring

### Documentation
- [ ] API docs updated
- [ ] Runbook created
- [ ] Emergency contacts listed
- [ ] Recovery procedures documented

---

## Support

For deployment issues:
- Check logs first
- Review this guide
- Contact: devops@devcycle.com

---

**Remember**: Always test in staging before production!
