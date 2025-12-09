# Production Deployment Checklist

Use this checklist before deploying to production to ensure everything is configured correctly.

## Pre-Deployment Checklist

### 1. Environment Configuration

- [x] `.env.production` file created and configured
- [x] Strong JWT secrets generated (min 64 characters, no weak patterns)
- [x] JWT access and refresh secrets are different
- [x] Database URL includes connection pooling parameters
- [x] Redis password configured (if applicable)
- [x] Gemini API key is valid and has sufficient quota
- [x] CORS origins use HTTPS only
- [x] All required environment variables set
- [x] `.env.production` added to `.gitignore`

### 2. Security Configuration

- [ ] Helmet.js security headers enabled
- [ ] HTTPS redirect configured (or handled by proxy)
- [ ] Rate limiting values appropriate for production
- [ ] Request size limits enforced (10MB max)
- [ ] Strong database password (not in version control)
- [ ] Strong Redis password (not in version control)
- [ ] CORS configured with specific origins (no wildcards)
- [ ] Content Security Policy configured
- [ ] XSS protection enabled

### 3. Database Setup

- [ ] PostgreSQL 16+ database created
- [ ] Database accessible from application server
- [ ] Connection pooling configured in DATABASE_URL
- [ ] Database migrations run (`npm run db:migrate:deploy`)
- [ ] Database seeded if needed (`npm run db:seed`)
- [ ] Automated backup strategy in place
- [ ] Database not publicly accessible

### 4. Redis Setup

- [ ] Redis 7+ instance created
- [ ] Redis accessible from application server
- [ ] Redis password configured
- [ ] Memory limits configured (512MB recommended)
- [ ] Eviction policy set to `allkeys-lru`
- [ ] Persistence enabled (AOF recommended)
- [ ] Redis not publicly accessible

### 5. Application Build

- [ ] Dependencies installed (`npm ci --only=production`)
- [ ] TypeScript compiled successfully (`npm run build`)
- [ ] No build errors or warnings
- [ ] Prisma Client generated (`npm run db:generate`)
- [ ] dist/ directory created with compiled files

### 6. Docker Configuration (if using Docker)

- [ ] Dockerfile builds successfully
- [ ] docker-compose.prod.yml configured
- [ ] Environment variables set in compose file
- [ ] Volume mounts configured for logs
- [ ] Health checks configured
- [ ] Resource limits set appropriately
- [ ] Restart policies configured

### 7. Monitoring & Logging

- [ ] Winston logger configured for production
- [ ] Log rotation enabled (using winston-daily-rotate-file)
- [ ] Log files directory created and writable
- [ ] Health endpoint accessible (`/api/v1/health`)
- [ ] Metrics endpoint accessible (`/api/v1/health/metrics`)
- [ ] Readiness probe configured (`/api/v1/health/ready`)
- [ ] Liveness probe configured (`/api/v1/health/live`)
- [ ] Log aggregation service configured (optional)
- [ ] Error tracking service configured (optional)

### 8. Performance Optimization

- [ ] Response compression enabled
- [ ] Connection pooling configured
- [ ] Redis auto-pipelining enabled
- [ ] Caching strategy verified
- [ ] Database indexes created
- [ ] Query optimization reviewed

### 9. Infrastructure

- [ ] Firewall rules configured
- [ ] SSL/TLS certificates installed and valid
- [ ] Domain DNS configured correctly
- [ ] CDN configured (if applicable)
- [ ] Load balancer configured (if applicable)
- [ ] Auto-scaling configured (if applicable)
- [ ] Network security groups configured

## Deployment Steps

### Option 1: Docker Compose

```bash
# 1. Build the image
docker-compose -f docker-compose.prod.yml build

# 2. Start services
docker-compose -f docker-compose.prod.yml up -d

# 3. Run migrations
docker exec -it prosepolish_backend_prod npm run db:migrate:deploy

# 4. (Optional) Seed database
docker exec -it prosepolish_backend_prod npm run db:seed

# 5. Verify deployment
curl http://localhost:3000/api/v1/health


🚀 Available Commands

  Manage Containers:
  # View logs
  docker-compose -f docker-compose.prod.yml logs -f backend

  # Stop all services
  docker-compose -f docker-compose.prod.yml down

  # Stop and remove volumes (fresh start)
  docker-compose -f docker-compose.prod.yml down -v

  # Restart specific service
  docker-compose -f docker-compose.prod.yml restart backend

  Database Operations:
  # Run migrations
  docker exec prosepolish_backend_prod npm run db:migrate:deploy

  # Access Prisma Studio (requires dev deps)
  npm run db:studio
```

### Option 2: Manual Deployment

```bash
# 1. Install production dependencies
npm ci --only=production

# 2. Build application
npm run build

# 3. Run migrations
npm run db:migrate:deploy

# 4. (Optional) Seed database
npm run db:seed

# 5. Start application
NODE_ENV=production npm start
```

### Option 3: PM2 (Recommended for VPS)

```bash
# 1. Install PM2 globally
npm install -g pm2

# 2. Install dependencies and build
npm ci --only=production
npm run build

# 3. Run migrations
npm run db:migrate:deploy

# 4. Start with PM2
pm2 start dist/server.js --name prosepolish-api -i max

# 5. Save PM2 configuration
pm2 save

# 6. Setup PM2 to start on boot
pm2 startup
```

## Post-Deployment Verification

### 1. Health Checks

```bash
# Check overall health
curl http://your-domain.com/api/v1/health

# Expected response:
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "...",
    "uptime": ...,
    "services": {
      "database": true,
      "redis": true,
      "geminiAi": true
    }
  }
}
```

### 2. Endpoint Testing

- [ ] Health endpoint returns 200
- [ ] Metrics endpoint returns statistics
- [ ] Auth endpoints working (register, login)
- [ ] Protected endpoints require authentication
- [ ] Rate limiting is enforced
- [ ] CORS headers present
- [ ] Security headers present (check with https://securityheaders.com)

### 3. Performance Testing

- [ ] Response times < 200ms for cached requests
- [ ] Response times < 1s for non-cached requests
- [ ] Memory usage stable over time
- [ ] No memory leaks detected
- [ ] CPU usage reasonable under load
- [ ] Database query performance acceptable

### 4. Security Testing

```bash
# Check security headers
curl -I https://your-domain.com/api/v1/health

# Should include:
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY
# - Strict-Transport-Security: max-age=...
# - Content-Security-Policy: ...
# - X-XSS-Protection: 1; mode=block
```

### 5. Error Handling

- [ ] Invalid routes return 404
- [ ] Invalid credentials return 401
- [ ] Missing auth token returns 401
- [ ] Server errors return 500 with proper error format
- [ ] Validation errors return 400 with details

### 6. Logging

- [ ] Application logs are being written
- [ ] Error logs are being written to error-*.log
- [ ] Access logs are being written to access-*.log
- [ ] Log rotation is working
- [ ] Old logs are being compressed and archived

## Monitoring

### Metrics to Monitor

1. **Application Health**
   - Uptime
   - Response times
   - Error rates
   - Request throughput

2. **Infrastructure**
   - CPU usage
   - Memory usage
   - Disk space
   - Network I/O

3. **Database**
   - Connection pool usage
   - Query performance
   - Slow queries
   - Active connections

4. **Redis**
   - Cache hit rate
   - Memory usage
   - Evictions
   - Connected clients

5. **External APIs**
   - Gemini API quota
   - Free Dictionary API availability
   - Response times

## Rollback Plan

If deployment fails:

### Docker Deployment

```bash
# 1. Stop new deployment
docker-compose -f docker-compose.prod.yml down

# 2. Restore previous version
docker-compose -f docker-compose.prod.yml up -d --scale backend=1

# 3. Check logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Manual Deployment

```bash
# 1. Stop application
pm2 stop prosepolish-api

# 2. Restore previous code
git checkout previous-tag

# 3. Rebuild
npm ci --only=production
npm run build

# 4. Restart
pm2 restart prosepolish-api
```

### Database Rollback

```bash
# 1. Restore from backup
psql -h HOST -U USER -d DATABASE < backup-YYYYMMDD.sql

# 2. Or rollback migration (if possible)
# Note: Only if migration is reversible
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

## Maintenance

### Regular Tasks

- [ ] **Daily**: Monitor error logs
- [ ] **Daily**: Check health metrics
- [ ] **Weekly**: Review performance metrics
- [ ] **Weekly**: Check disk space usage
- [ ] **Monthly**: Review and rotate logs
- [ ] **Monthly**: Update dependencies (security patches)
- [ ] **Quarterly**: Review and optimize database queries
- [ ] **Quarterly**: Review and update security configurations

### Backup Strategy

- [ ] **Database**: Automated daily backups with 30-day retention
- [ ] **Redis**: AOF persistence enabled
- [ ] **Logs**: Archived and compressed after rotation
- [ ] **Environment**: Secure backup of .env.production in secrets manager

## Emergency Contacts

- DevOps Engineer: [contact]
- Database Administrator: [contact]
- Security Team: [contact]
- On-Call Engineer: [contact]

## Additional Resources

- [Production Deployment Guide](./PRODUCTION.md)
- [API Documentation](./API.md)
- [Development Tasks](./DEVELOPMENT_TASKS.md)
- [System Architecture](./ARCHITECTURE.md)

---

**Deployment Date**: ___________
**Deployed By**: ___________
**Version**: ___________
**Environment**: Production

**Sign-off**: ___________
