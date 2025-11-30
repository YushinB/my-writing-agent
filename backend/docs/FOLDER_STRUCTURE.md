# Backend Folder Structure

## Directory Layout

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.ts      # Prisma client configuration
│   │   ├── redis.ts         # Redis client configuration
│   │   ├── gemini.ts        # Gemini AI client configuration
│   │   └── env.ts           # Environment variable validation (Zod)
│   │
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # JWT authentication middleware
│   │   ├── errorHandler.ts # Global error handling
│   │   ├── validation.ts    # Request validation middleware (Zod)
│   │   ├── rateLimiter.ts   # Rate limiting configuration
│   │   └── cors.ts          # CORS configuration
│   │
│   ├── routes/              # API route definitions
│   │   ├── index.ts         # Main router
│   │   ├── auth.routes.ts   # Auth endpoints
│   │   ├── dictionary.routes.ts  # Dictionary endpoints
│   │   ├── myWords.routes.ts     # User's saved words endpoints
│   │   ├── llm.routes.ts    # LLM/AI endpoints
│   │   ├── settings.routes.ts    # User settings endpoints
│   │   └── health.routes.ts # Health check endpoint
│   │
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── dictionary.controller.ts
│   │   ├── myWords.controller.ts
│   │   ├── llm.controller.ts
│   │   ├── settings.controller.ts
│   │   └── health.controller.ts
│   │
│   ├── services/            # Business logic
│   │   ├── auth.service.ts  # Authentication logic
│   │   ├── user.service.ts  # User management
│   │   ├── dictionary.service.ts     # Dictionary lookups
│   │   ├── freeDictionary.service.ts # Free Dictionary API integration
│   │   ├── myWords.service.ts        # User's saved words logic
│   │   ├── llm.service.ts   # Gemini AI service
│   │   ├── cache.service.ts # Redis caching logic
│   │   └── session.service.ts        # Session management
│   │
│   ├── models/              # Prisma schema and types
│   │   └── schema.prisma    # Database schema
│   │
│   ├── types/               # TypeScript type definitions
│   │   ├── express.d.ts     # Express type extensions
│   │   ├── auth.types.ts    # Auth-related types
│   │   ├── dictionary.types.ts      # Dictionary types
│   │   ├── llm.types.ts     # LLM request/response types
│   │   └── api.types.ts     # Common API response types
│   │
│   ├── utils/               # Utility functions
│   │   ├── logger.ts        # Winston logger setup
│   │   ├── errors.ts        # Custom error classes
│   │   ├── validation.ts    # Zod validation schemas
│   │   ├── hash.ts          # Hashing utilities (bcrypt)
│   │   ├── jwt.ts           # JWT utilities
│   │   └── transform.ts     # Data transformation helpers
│   │
│   ├── jobs/                # Background jobs
│   │   ├── cacheCleanup.ts  # Clean expired cache entries
│   │   └── scheduler.ts     # Cron job scheduler
│   │
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
│
├── prisma/                  # Prisma files
│   ├── schema.prisma        # Database schema (symlink to src/models)
│   ├── migrations/          # Database migrations
│   └── seed.ts              # Database seeding script
│
├── tests/                   # Test files
│   ├── unit/                # Unit tests
│   │   ├── services/
│   │   ├── utils/
│   │   └── middleware/
│   │
│   ├── integration/         # Integration tests
│   │   ├── auth.test.ts
│   │   ├── dictionary.test.ts
│   │   ├── myWords.test.ts
│   │   └── llm.test.ts
│   │
│   ├── e2e/                 # End-to-end tests
│   │   └── api.test.ts
│   │
│   ├── setup.ts             # Test setup and teardown
│   └── helpers.ts           # Test helper functions
│
├── scripts/                 # Utility scripts
│   ├── setup-db.sh          # Database setup script
│   ├── seed-dictionary.ts   # Seed common words
│   └── generate-types.sh    # Generate Prisma types
│
├── logs/                    # Application logs (gitignored)
│   ├── error.log
│   ├── combined.log
│   └── access.log
│
├── .env.example             # Environment variables template
├── .env                     # Environment variables (gitignored)
├── .gitignore               # Git ignore file
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
├── jest.config.js           # Jest test configuration
├── docker-compose.yml       # Docker services (PostgreSQL, Redis)
├── Dockerfile               # Docker container for backend
├── .eslintrc.js             # ESLint configuration
├── .prettierrc              # Prettier configuration
├── DESIGN.md                # Design documentation
├── REDIS_ARCHITECTURE.md    # Redis architecture documentation
├── FOLDER_STRUCTURE.md      # This file
└── README.md                # Backend setup instructions
```

---

## Detailed File Purposes

### `/src/config/`

**database.ts**
```typescript
// Prisma client initialization
// Connection pooling configuration
// Error handling for database connections
```

**redis.ts**
```typescript
// Redis client setup (ioredis)
// Connection error handling
// Retry strategy
// Event listeners
```

**gemini.ts**
```typescript
// Google Generative AI client initialization
// Model configuration
// API key management
```

**env.ts**
```typescript
// Environment variable validation using Zod
// Type-safe environment variables
// Default values
```

---

### `/src/middleware/`

**auth.ts**
```typescript
// JWT token verification
// Attach user to request object
// Handle token expiration
```

**errorHandler.ts**
```typescript
// Global error handler
// Convert errors to API response format
// Log errors
```

**validation.ts**
```typescript
// Request body validation using Zod schemas
// Query parameter validation
// URL parameter validation
```

**rateLimiter.ts**
```typescript
// Redis-backed rate limiting
// Different limits for different endpoints
// Rate limit error responses
```

**cors.ts**
```typescript
// CORS configuration
// Allowed origins from environment
// Credentials handling
```

---

### `/src/routes/`

**index.ts**
```typescript
// Main router that combines all sub-routers
// API versioning
// Route prefix (/api)
```

**auth.routes.ts**
```typescript
// POST /auth/register
// POST /auth/login
// POST /auth/refresh
// POST /auth/logout
// GET  /auth/me
```

**dictionary.routes.ts**
```typescript
// GET    /dictionary/search
// GET    /dictionary/word/:word
// GET    /dictionary/word/:word/full
// POST   /dictionary/words (admin)
```

**myWords.routes.ts**
```typescript
// GET    /my-words
// POST   /my-words
// DELETE /my-words/:id
// GET    /my-words/search
```

**llm.routes.ts**
```typescript
// POST /llm/correct
// POST /llm/define
// POST /llm/suggest
// POST /llm/analyze
```

**settings.routes.ts**
```typescript
// GET   /settings
// PATCH /settings
```

**health.routes.ts**
```typescript
// GET /health
```

---

### `/src/controllers/`

Controllers handle HTTP requests and responses. They:
- Extract data from request
- Call appropriate service methods
- Format response
- Handle errors

---

### `/src/services/`

Services contain business logic. They:
- Don't know about HTTP (req/res)
- Interact with database
- Call external APIs
- Implement caching strategies
- Return data or throw errors

---

### `/src/types/`

**express.d.ts**
```typescript
// Extend Express types to include user on request
declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: 'user' | 'admin';
    };
  }
}
```

**auth.types.ts**
```typescript
// User, LoginResponse, TokenPair, etc.
```

**dictionary.types.ts**
```typescript
// DictionaryEntry, WordDefinition, FreeDictionaryResponse, etc.
```

**llm.types.ts**
```typescript
// CorrectionRequest, CorrectionResponse, TextSegment, etc.
```

**api.types.ts**
```typescript
// ApiResponse, ApiError, PaginationMeta, etc.
```

---

### `/src/utils/`

**logger.ts**
```typescript
// Winston logger configuration
// Log levels: error, warn, info, debug
// File and console transports
```

**errors.ts**
```typescript
// Custom error classes
// NotFoundError, ValidationError, AuthenticationError, etc.
// Error codes
```

**validation.ts**
```typescript
// Zod schemas for request validation
// Reusable validation functions
```

**hash.ts**
```typescript
// bcrypt hashing
// Password comparison
```

**jwt.ts**
```typescript
// Generate access/refresh tokens
// Verify tokens
// Decode tokens
```

**transform.ts**
```typescript
// Transform Free Dictionary API response to our schema
// Transform database models to API responses
```

---

### `/src/jobs/`

**cacheCleanup.ts**
```typescript
// Clean expired PostgreSQL cache entries
// Run daily via cron
```

**scheduler.ts**
```typescript
// Set up all cron jobs
// Job monitoring
```

---

### `/src/`

**app.ts**
```typescript
// Express app initialization
// Middleware setup
// Routes registration
// Error handlers
// Export app (for testing)
```

**server.ts**
```typescript
// Start HTTP server
// Connect to database
// Connect to Redis
// Graceful shutdown handling
```

---

## Docker Configuration

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: prosepolish-db
    environment:
      POSTGRES_USER: prosepolish
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: prosepolish
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: prosepolish-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  backend:
    build: .
    container_name: prosepolish-backend
    depends_on:
      - postgres
      - redis
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://prosepolish:dev_password@postgres:5432/prosepolish
      REDIS_HOST: redis
      REDIS_PORT: 6379
    ports:
      - "3001:3001"
    volumes:
      - ./src:/app/src
      - ./prisma:/app/prisma
    command: npm run dev

volumes:
  postgres_data:
  redis_data:
```

---

## Configuration Files

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "typeRoots": ["./node_modules/@types", "./src/types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### `package.json` Scripts

```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:seed": "ts-node prisma/seed.ts",
    "db:studio": "prisma studio",
    "type-check": "tsc --noEmit"
  }
}
```

---

## Environment Variables (.env.example)

```env
# Node Environment
NODE_ENV=development

# Server
PORT=3001
FRONTEND_URL=http://localhost:8080

# Database
DATABASE_URL=postgresql://prosepolish:password@localhost:5432/prosepolish?schema=public

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS_ENABLED=false

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# Free Dictionary API
FREE_DICTIONARY_API_URL=https://api.dictionaryapi.dev/api/v2/entries/en
DICTIONARY_CACHE_TTL_DAYS=30
DICTIONARY_REQUEST_DELAY_MS=100

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000

# Logging
LOG_LEVEL=info
```

---

## .gitignore

```
# Dependencies
node_modules/

# Build output
dist/
build/

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Prisma
prisma/migrations/**/migration.sql

# Temporary files
*.tmp
*.temp
```

---

## Best Practices

### File Naming Conventions

- **Routes:** `*.routes.ts`
- **Controllers:** `*.controller.ts`
- **Services:** `*.service.ts`
- **Types:** `*.types.ts`
- **Tests:** `*.test.ts`
- **Middleware:** Use descriptive names (auth.ts, validation.ts)

### Import Organization

```typescript
// 1. Node.js built-ins
import crypto from 'crypto';

// 2. External dependencies
import express from 'express';
import { z } from 'zod';

// 3. Internal modules (absolute imports)
import { prisma } from '@/config/database';
import { redis } from '@/config/redis';

// 4. Types
import type { User } from '@/types/auth.types';

// 5. Relative imports (avoid if possible)
import { helper } from '../utils/helper';
```

### Error Handling Pattern

```typescript
// In services - throw errors
if (!user) {
  throw new NotFoundError('User not found');
}

// In controllers - catch and respond
try {
  const result = await service.doSomething();
  res.json({ success: true, data: result });
} catch (error) {
  next(error); // Pass to error handler middleware
}
```

### Async/Await Pattern

```typescript
// Always use try-catch with async functions
async function handler(req: Request, res: Response, next: NextFunction) {
  try {
    // Your code
  } catch (error) {
    next(error);
  }
}
```

---

**Last Updated:** 2024-11-30
**Version:** 1.0
