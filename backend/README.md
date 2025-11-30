# ProsePolish Backend

AI-Powered Writing Assistant Backend - Express.js + Prisma + PostgreSQL + Redis + TypeScript

---

## ⚡ Quick Start Commands

```bash
# 1. Check Docker containers
docker ps

# 2. Start services (if not running)
docker-compose up -d

# 3. Install dependencies (first time only)
npm install

# 4. Setup database (first time only)
npm run db:generate && npm run db:migrate

# 5. Start development server
npm run dev
```

Server will be available at: **http://localhost:5000/api/v1**

---

## 📚 Documentation

- **[DESIGN.md](DESIGN.md)** - Complete API design and architecture
- **[REDIS_ARCHITECTURE.md](REDIS_ARCHITECTURE.md)** - Redis caching strategy
- **[FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md)** - Project structure and file organization
- **[DEVELOPMENT_TASKS.md](DEVELOPMENT_TASKS.md)** - Step-by-step development checklist

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Docker and Docker Compose (for PostgreSQL and Redis)

### 1. Clone & Install

```bash
cd backend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```env
DATABASE_URL=postgresql://prosepolish:password@localhost:5432/prosepolish
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Start Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Run database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# (Optional) Seed database
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start at `http://localhost:5000`

---

## 🚀 Quick Deployment Guide (First Time Setup)

This guide covers the complete setup process including common issues and their solutions.

### Step 1: Check Prerequisites

```bash
# Verify Docker is installed
docker --version

# Verify Node.js is installed (18+)
node --version

# Verify npm is installed
npm --version
```

### Step 2: Start PostgreSQL and Redis

If you already have containers running:
```bash
# Check for existing containers
docker ps -a

# If you see prosepolish_postgres and prosepolish_redis running, you're good!
# Otherwise, start them:
docker run -d --name prosepolish_postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=prosepolish_db \
  postgres:16-alpine

docker run -d --name prosepolish_redis \
  -p 6379:6379 \
  redis:7-alpine
```

**Or use docker-compose:**
```bash
docker-compose up -d
```

### Step 3: Verify Services Are Running

```bash
# Check containers are healthy
docker ps

# You should see both containers with status "Up" and "healthy"
# Example output:
# CONTAINER ID   IMAGE                STATUS                   PORTS
# 3f057708c240   postgres:16-alpine   Up 5 minutes (healthy)   0.0.0.0:5432->5432/tcp
# 522c768038a5   redis:7-alpine       Up 5 minutes (healthy)   0.0.0.0:6379->6379/tcp
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env and ensure these values match your Docker setup:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/prosepolish_db?schema=public
# REDIS_HOST=localhost
# REDIS_PORT=6379
# Add your GEMINI_API_KEY if you have one
```

### Step 6: Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed database with sample data
npm run db:seed
```

### Step 7: Start Development Server

```bash
npm run dev
```

You should see:
```
✅ Gemini AI client initialized
✅ Database connected successfully
✅ Redis connected successfully
🚀 Server started successfully!
📡 Listening on port 5000
📝 API: http://localhost:5000/api/v1
💚 Health: http://localhost:5000/api/v1/health
```

### Step 8: Verify Server is Running

```bash
# Test health endpoint
curl http://localhost:5000/api/v1/health

# Or open in browser:
# http://localhost:5000/api/v1/health
```

---

## 🔧 Common Issues & Solutions

### Issue 1: TypeScript Compilation Error - Property 'userId' does not exist

**Error:**
```
error TS2339: Property 'userId' does not exist on type 'Request'
```

**Solution:**
This is already fixed in `tsconfig.json`, but if you encounter it:

1. Ensure `tsconfig.json` has these settings:
```json
{
  "compilerOptions": {
    ...
    "typeRoots": ["./node_modules/@types", "./src/types"],
    "types": ["node", "jest"]
  },
  "ts-node": {
    "files": true
  }
}
```

2. The type declarations are in `src/types/express.d.ts` and should extend the Express Request type.

### Issue 2: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5432
Error: listen EADDRINUSE: address already in use :::6379
```

**Solution:**
```bash
# Check what's using the ports
docker ps

# If you have existing containers with different names:
docker stop <container-id>
docker rm <container-id>

# Or use the existing containers if they have the correct configuration
```

### Issue 3: Database Connection Failed

**Error:**
```
Can't reach database server at localhost:5432
```

**Solutions:**
```bash
# 1. Check if PostgreSQL is running
docker ps | grep postgres

# 2. Check PostgreSQL logs
docker logs prosepolish_postgres

# 3. Verify DATABASE_URL in .env matches Docker config
cat .env | grep DATABASE_URL

# 4. Restart PostgreSQL container
docker restart prosepolish_postgres

# 5. Wait 5-10 seconds for PostgreSQL to be ready
sleep 10
```

### Issue 4: Redis Connection Failed

**Error:**
```
❌ Redis connection error
Connection is closed
```

**Solutions:**
```bash
# 1. Check if Redis is running
docker ps | grep redis

# 2. Check Redis logs
docker logs prosepolish_redis

# 3. Restart Redis container
docker restart prosepolish_redis

# 4. Test Redis connection
docker exec -it prosepolish_redis redis-cli ping
# Should respond: PONG
```

### Issue 5: Server Exits Immediately Without Error

**Possible causes:**
1. Check `logs/exceptions.log` for TypeScript compilation errors
2. Missing environment variables
3. Database or Redis not ready

**Solution:**
```bash
# Check exception logs
tail -50 logs/exceptions.log

# Check if .env file exists and has required variables
cat .env

# Ensure services are ready
docker ps
```

### Issue 6: Prisma Client Not Generated

**Error:**
```
Cannot find module '@prisma/client'
```

**Solution:**
```bash
# Generate Prisma client
npm run db:generate

# If that fails, try:
npx prisma generate
```

---

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:migrate       # Run Prisma migrations
npm run db:generate      # Generate Prisma client
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type checking
```

---

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration (database, redis, env)
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utilities
│   ├── jobs/            # Background jobs
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── prisma/              # Database schema & migrations
├── tests/               # Test files
└── docker-compose.yml   # Docker services
```

See [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md) for detailed structure.

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Dictionary
- `GET /api/dictionary/search?q=word` - Search dictionary
- `GET /api/dictionary/word/:word` - Get word definition
- `GET /api/dictionary/word/:word/full` - Get full word data
- `POST /api/dictionary/words` - Add word (admin only)

### My Words
- `GET /api/my-words` - Get user's saved words
- `POST /api/my-words` - Add word to user's dictionary
- `DELETE /api/my-words/:id` - Remove word
- `GET /api/my-words/search?q=word` - Search saved words

### LLM
- `POST /api/llm/correct` - Correct text with AI
- `POST /api/llm/define` - Get AI-powered definition
- `POST /api/llm/suggest` - Get writing suggestions
- `POST /api/llm/analyze` - Analyze writing style

### Settings
- `GET /api/settings` - Get user settings
- `PATCH /api/settings` - Update user settings

### Health
- `GET /api/health` - Health check

See [DESIGN.md](DESIGN.md) for complete API documentation.

---

## 🔧 Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Language | TypeScript |
| Database | PostgreSQL 15 |
| ORM | Prisma |
| Cache | Redis 7 |
| Authentication | JWT |
| Validation | Zod |
| AI | Google Gemini |
| Testing | Jest |

---

## 🏃 Development Workflow

### 1. Create a New Feature

```bash
# 1. Create service
src/services/feature.service.ts

# 2. Create controller
src/controllers/feature.controller.ts

# 3. Create routes
src/routes/feature.routes.ts

# 4. Add to main router
src/routes/index.ts

# 5. Write tests
tests/integration/feature.test.ts
```

### 2. Update Database Schema

```bash
# 1. Edit Prisma schema
prisma/schema.prisma

# 2. Create migration
npm run db:migrate

# 3. Generate Prisma client
npm run db:generate
```

### 3. Add Environment Variable

```bash
# 1. Add to .env.example
FEATURE_API_KEY=

# 2. Add validation in src/config/env.ts
FEATURE_API_KEY: z.string()

# 3. Use in code
import { env } from '@/config/env';
const apiKey = env.FEATURE_API_KEY;
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Structure

```typescript
describe('Auth Service', () => {
  beforeEach(async () => {
    // Setup: clear database, create test data
  });

  afterEach(async () => {
    // Teardown: clean up
  });

  it('should register a new user', async () => {
    // Test implementation
  });
});
```

---

## 🐳 Docker

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Remove volumes (clean slate)
docker-compose down -v
```

### Production Build

```bash
# Build production image
docker build -t prosepolish-backend .

# Run production container
docker run -p 5000:5000 --env-file .env prosepolish-backend
```

---

## 🔒 Security

- **Authentication:** JWT-based with refresh tokens
- **Password Hashing:** bcrypt (cost factor 10)
- **Rate Limiting:** Redis-backed, per-endpoint limits
- **Input Validation:** Zod schemas on all inputs
- **SQL Injection:** Prevented by Prisma ORM
- **XSS Prevention:** Input sanitization
- **CORS:** Configured for specific origins

---

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:5000/api/v1/health
```

Response:
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "redis": "connected",
    "gemini": "available",
    "freeDictionaryApi": "available"
  },
  "cache": {
    "redis": {
      "usedMemory": "15.2 MB",
      "keys": 3421,
      "hitRate": "94.7%"
    }
  }
}
```

### Logs

```bash
# Development logs (console)
npm run dev

# Production logs (files)
tail -f logs/error.log
tail -f logs/combined.log
```

---

## 🚀 Deployment

### Railway / Render

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### VPS (DigitalOcean, AWS, etc.)

1. Install Node.js, PostgreSQL, Redis
2. Clone repository
3. Install dependencies: `npm install`
4. Build: `npm run build`
5. Run migrations: `npm run db:migrate`
6. Start with PM2: `pm2 start dist/server.js`

### Docker Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📈 Performance

### Caching Strategy

- **L1 Cache (Redis):** 1-5ms response time
- **L2 Cache (PostgreSQL):** 10-20ms response time
- **External APIs:** 200-2000ms response time

### Optimization Tips

1. Use Redis caching for frequently accessed data
2. Enable compression middleware
3. Use connection pooling
4. Monitor slow queries with Prisma logging
5. Implement pagination for large datasets

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string
echo $DATABASE_URL

# Test connection
npm run db:studio
```

### Redis Connection Issues

```bash
# Check Redis is running
docker ps | grep redis

# Test Redis connection
redis-cli ping

# Check Redis logs
docker logs prosepolish-redis
```

### Migration Issues

```bash
# Reset database (development only!)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

---

## 📝 Code Style

### Naming Conventions

- **Files:** `camelCase.ts` (e.g., `auth.service.ts`)
- **Classes:** `PascalCase` (e.g., `AuthService`)
- **Functions:** `camelCase` (e.g., `getUserById`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `JWT_EXPIRATION`)
- **Types/Interfaces:** `PascalCase` (e.g., `UserResponse`)

### Import Order

```typescript
// 1. Node.js built-ins
import crypto from 'crypto';

// 2. External dependencies
import express from 'express';

// 3. Internal modules
import { prisma } from '@/config/database';

// 4. Types
import type { User } from '@/types';
```

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Run linter: `npm run lint`
5. Run tests: `npm test`
6. Create pull request

---

## 📄 License

MIT

---

## 🔗 Links

- [Design Document](DESIGN.md)
- [Development Tasks](DEVELOPMENT_TASKS.md)
- [Folder Structure](FOLDER_STRUCTURE.md)
- [Redis Architecture](REDIS_ARCHITECTURE.md)

---

**Version:** 1.0
**Last Updated:** 2024-11-30
