# Production Deployment Guide

This guide covers deploying the ProsePolish backend to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Security Checklist](#security-checklist)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Services

- **PostgreSQL 16+** (managed service recommended)
  - AWS RDS, Railway, Heroku Postgres, DigitalOcean Managed Database
- **Redis 7+** (managed service recommended)
  - Upstash, Redis Cloud, AWS ElastiCache
- **Node.js 20+** (for manual deployment)
- **Docker & Docker Compose** (for containerized deployment)

### Required Accounts/Keys

- Google Gemini API key (get from: https://makersuite.google.com/app/apikey)
- Database credentials
- Redis credentials (if using password-protected instance)

## Environment Setup

### 1. Generate Strong Secrets

Generate secure secrets for JWT tokens:

```bash
# Generate JWT access secret
openssl rand -base64 64

# Generate JWT refresh secret (use different value)
openssl rand -base64 64
```

### 2. Configure Environment Variables

Copy the production environment template:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and set all required values:

**Critical Variables to Update:**

- `DATABASE_URL` - Your PostgreSQL connection string with connection pooling params
- `JWT_ACCESS_SECRET` - Strong random secret (min 64 characters)
- `JWT_REFRESH_SECRET` - Different strong random secret
- `GEMINI_API_KEY` - Your Google Gemini API key
- `CORS_ORIGIN` - Your frontend domain(s) with HTTPS
- `REDIS_PASSWORD` - Your Redis password (if applicable)
- `POSTGRES_PASSWORD` - Your PostgreSQL password

**Example Production DATABASE_URL:**

```
postgresql://user:password@host:5432/dbname?schema=public&connection_limit=10&pool_timeout=20&connect_timeout=10
```

### 3. Validate Environment

The application will validate environment variables on startup. Common issues:

- JWT secrets contain weak patterns (secret, password, etc.)
- CORS origins don't use HTTPS in production
- Database URL is malformed
- Required secrets are missing

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Build the Docker image:**

```bash
docker-compose -f docker-compose.prod.yml build
```

2. **Start services:**

```bash
# Start all services (backend, postgres, redis)
docker-compose -f docker-compose.prod.yml up -d

# Or start only specific services
docker-compose -f docker-compose.prod.yml up -d postgres redis
docker-compose -f docker-compose.prod.yml up -d backend
```

3. **Run database migrations:**

```bash
# Connect to backend container
docker exec -it prosepolish_backend_prod sh

# Run migrations
npm run db:migrate:deploy

# (Optional) Seed database
npm run db:seed

# Exit container
exit
```

4. **Verify deployment:**

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Check health
curl http://localhost:3000/api/v1/health
```

### Using Standalone Docker

1. **Build the image:**

```bash
docker build -t prosepolish-backend:latest .
```

2. **Run the container:**

```bash
docker run -d \
  --name prosepolish-backend \
  -p 3000:3000 \
  --env-file .env.production \
  -v $(pwd)/logs:/app/logs \
  prosepolish-backend:latest
```

## Manual Deployment

### 1. Install Dependencies

```bash
npm ci --only=production
```

### 2. Build TypeScript

```bash
npm run build
```

### 3. Run Database Migrations

```bash
npm run db:migrate:deploy
```

### 4. (Optional) Seed Database

```bash
npm run db:seed
```

### 5. Start Application

```bash
# Using npm
NODE_ENV=production npm start

# Or using node directly
NODE_ENV=production node dist/server.js

# With PM2 (recommended)
pm2 start dist/server.js --name prosepolish-backend -i max --env production
```

## Security Checklist

Before deploying to production, verify:

### Environment Security

- [ ] Strong, unique JWT secrets (not containing "secret", "password", etc.)
- [ ] Different access and refresh secrets
- [ ] HTTPS-only CORS origins
- [ ] Database password is strong and unique
- [ ] Redis password is enabled and strong
- [ ] `.env.production` is never committed to version control
- [ ] Secrets stored in environment variables or secrets manager

### Application Security

- [ ] Helmet.js security headers enabled
- [ ] HTTPS redirect enabled (if not behind HTTPS proxy)
- [ ] Rate limiting configured appropriately
- [ ] Request size limits enforced (10MB max)
- [ ] SQL injection prevention (Prisma provides this)
- [ ] XSS prevention via Content Security Policy
- [ ] CORS configured with specific origins (no wildcards)

### Infrastructure Security

- [ ] Database not publicly accessible (use VPC/private network)
- [ ] Redis not publicly accessible
- [ ] Firewall rules configured
- [ ] SSL/TLS certificates valid
- [ ] Regular security updates scheduled

## Monitoring

### Health Endpoints

The application provides several monitoring endpoints:

```bash
# Overall health check
GET /api/v1/health

# Kubernetes readiness probe
GET /api/v1/health/ready

# Kubernetes liveness probe
GET /api/v1/health/live

# Detailed metrics
GET /api/v1/health/metrics
```

### Metrics Provided

- **System Metrics:** Memory, CPU, uptime
- **Redis Metrics:** Cache hit rate, total commands, connections
- **Database Metrics:** User count, saved words, dictionary entries
- **Process Info:** Node version, platform, architecture

### Log Files

Production logs are automatically rotated:

```
logs/
├── error-YYYY-MM-DD.log          # Error logs (30 days retention)
├── combined-YYYY-MM-DD.log       # All logs (14 days retention)
├── access-YYYY-MM-DD.log         # HTTP access (7 days retention)
├── exceptions-YYYY-MM-DD.log     # Uncaught exceptions
└── rejections-YYYY-MM-DD.log     # Unhandled rejections
```

Rotated logs are compressed (`.gz`) to save space.

### Recommended Monitoring Tools

- **Application Monitoring:** New Relic, Datadog, AppSignal
- **Log Aggregation:** Logtail, Papertrail, Logz.io
- **Uptime Monitoring:** UptimeRobot, Pingdom, StatusCake
- **Error Tracking:** Sentry, Rollbar

## Database Management

### Migrations

```bash
# Deploy migrations (production-safe)
npm run db:migrate:deploy

# Check migration status
npx prisma migrate status

# Generate Prisma Client
npm run db:generate
```

### Backups

**Automated Backups (Recommended):**

- Use managed database service with automatic backups
- AWS RDS: Automated daily backups with point-in-time recovery
- Railway/Heroku: Automatic daily backups

**Manual Backups:**

```bash
# PostgreSQL backup
pg_dump -h HOST -U USER -d DATABASE > backup-$(date +%Y%m%d).sql

# Restore from backup
psql -h HOST -U USER -d DATABASE < backup-YYYYMMDD.sql
```

## Performance Optimization

### Database Connection Pooling

Connection pool is configured in `DATABASE_URL`:

```
?connection_limit=10&pool_timeout=20&connect_timeout=10
```

Adjust based on your instance size:

- Small (512MB RAM): `connection_limit=5`
- Medium (1GB RAM): `connection_limit=10`
- Large (2GB+ RAM): `connection_limit=20`

### Redis Configuration

Redis is configured with:

- LRU eviction policy (`allkeys-lru`)
- Max memory: 512MB
- Persistence: AOF (appendonly)
- Auto-pipelining enabled for better performance

### Response Compression

All responses are automatically compressed using gzip/deflate when:

- Response size > 1KB
- Client supports compression

### Caching Strategy

Multi-layer caching:

1. **Redis Cache:** Fast in-memory cache (15min - 7 days TTL)
2. **PostgreSQL Cache:** Database-backed cache for dictionary entries
3. **Response Headers:** Browser caching for static assets (1 year)

## Scaling

### Horizontal Scaling

The application is stateless and can be horizontally scaled:

```bash
# Using Docker Compose (multiple instances)
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Using PM2 (cluster mode)
pm2 start dist/server.js -i max
```

### Vertical Scaling

Resource limits in Docker Compose:

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

Adjust based on load:

- Light load: 512MB RAM, 0.5 CPU
- Medium load: 1GB RAM, 1 CPU
- Heavy load: 2GB+ RAM, 2+ CPU

## Troubleshooting

### Application Won't Start

1. Check environment variables:

```bash
node -e "require('./dist/server.js')"
```

2. Check database connection:

```bash
npx prisma db pull
```

3. Check Redis connection:

```bash
redis-cli -h HOST -p PORT -a PASSWORD ping
```

### High Memory Usage

- Check for memory leaks in logs
- Reduce connection pool size
- Enable Redis memory limits
- Scale horizontally

### Slow Performance

1. Check database query performance:

```sql
-- PostgreSQL slow query log
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

2. Check Redis cache hit rate:

```bash
curl http://localhost:3000/api/v1/health/metrics
```

3. Enable query logging:

```env
DATABASE_URL=...?&log_queries=true
```

### Connection Timeouts

- Increase `connect_timeout` in DATABASE_URL
- Check network latency to database
- Verify firewall rules
- Check database connection limits

## Deployment Platforms

### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create project
railway init

# Add PostgreSQL
railway add postgresql

# Add Redis
railway add redis

# Deploy
railway up
```

### Heroku

```bash
# Install Heroku CLI
npm i -g heroku

# Login
heroku login

# Create app
heroku create prosepolish-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Add Redis
heroku addons:create heroku-redis:mini

# Set environment variables
heroku config:set JWT_ACCESS_SECRET="..."
heroku config:set JWT_REFRESH_SECRET="..."
heroku config:set GEMINI_API_KEY="..."

# Deploy
git push heroku main

# Run migrations
heroku run npm run db:migrate:deploy
```

### DigitalOcean App Platform

1. Push code to GitHub
2. Create new App in DigitalOcean
3. Connect GitHub repository
4. Add Managed PostgreSQL database
5. Add Managed Redis database
6. Set environment variables
7. Deploy

### AWS (EC2 + RDS + ElastiCache)

1. Launch EC2 instance (t3.small or larger)
2. Create RDS PostgreSQL instance
3. Create ElastiCache Redis cluster
4. Configure Security Groups
5. Deploy using Docker or PM2
6. Set up Application Load Balancer
7. Configure Auto Scaling (optional)

## Support

For issues or questions:

- GitHub Issues: https://github.com/yourusername/prosepolish/issues
- Documentation: See `/docs` folder
- Email: support@yourdomain.com

## License

MIT License - See LICENSE file for details
