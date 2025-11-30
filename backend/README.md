# ProsePolish Backend

AI-Powered Writing Assistant Backend - Express.js + Prisma + PostgreSQL + Redis + TypeScript

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

Server will start at `http://localhost:3001`

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
docker run -p 3001:3001 --env-file .env prosepolish-backend
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
curl http://localhost:3001/api/health
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
