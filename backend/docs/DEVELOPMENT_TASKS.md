# Backend Development Task List

## Project Setup Phase

### 1. Project Initialization ⏱️ 1-2 hours

- [x] **1.1** Create `backend/` directory structure
  - [x] Create all folders from FOLDER_STRUCTURE.md
  - [x] Set up src/ directory with subdirectories

- [x] **1.2** Initialize Node.js project
  ```bash
  cd backend
  npm init -y
  ```

- [x] **1.3** Install dependencies
  ```bash
  # Core dependencies
  npm install express cors dotenv
  npm install @prisma/client ioredis axios
  npm install @google/generative-ai
  npm install bcrypt jsonwebtoken
  npm install zod
  npm install express-rate-limit rate-limit-redis
  npm install node-cron
  npm install winston morgan

  # Dev dependencies
  npm install -D typescript @types/node @types/express
  npm install -D @types/bcrypt @types/jsonwebtoken
  npm install -D @types/cors @types/morgan
  npm install -D @types/node-cron
  npm install -D prisma
  npm install -D nodemon ts-node
  npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
  npm install -D prettier eslint-config-prettier
  npm install -D jest @types/jest ts-jest supertest @types/supertest
  ```

- [x] **1.4** Create configuration files
  - [x] Create `tsconfig.json`
  - [x] Create `.eslintrc.js`
  - [x] Create `.prettierrc`
  - [x] Create `jest.config.js`
  - [x] Create `.env.example`
  - [x] Create `.env` (copy from .env.example)
  - [x] Create `.gitignore`

- [x] **1.5** Update `package.json` scripts
  - [x] Add dev, build, start scripts
  - [x] Add test scripts
  - [x] Add linting scripts
  - [x] Add Prisma scripts

---

## Database Setup Phase

### 2. Prisma & PostgreSQL Setup ⏱️ 2-3 hours

- [x] **2.1** Set up Docker services
  - [x] Create `docker-compose.yml`
  - [x] Start PostgreSQL container
    ```bash
    docker-compose up -d postgres
    ```
  - [x] Verify PostgreSQL is running
    ```bash
    docker ps
    ```

- [x] **2.2** Initialize Prisma
  ```bash
  npx prisma init
  ```

- [x] **2.3** Create Prisma schema
  - [x] Define User model
  - [x] Define SavedWord model
  - [x] Define DictionaryEntry model
  - [x] Define UserSettings model
  - [x] Define AIUsageLog model
  - [x] Add enums (UserRole)
  - [x] Add indexes

- [x] **2.4** Run first migration
  ```bash
  npx prisma migrate dev --name init
  ```

- [x] **2.5** Generate Prisma Client
  ```bash
  npx prisma generate
  ```

- [x] **2.6** Create database configuration
  - [x] Create `src/config/database.ts`
  - [x] Set up Prisma client singleton
  - [x] Add connection error handling

---

## Redis Setup Phase

### 3. Redis Configuration ⏱️ 1 hour

- [ ] **3.1** Start Redis container
  ```bash
  docker-compose up -d redis
  ```

- [ ] **3.2** Create Redis configuration
  - [ ] Create `src/config/redis.ts`
  - [ ] Set up ioredis client
  - [ ] Configure retry strategy
  - [ ] Add event listeners (connect, error)
  - [ ] Implement lazy connect

- [ ] **3.3** Test Redis connection
  - [ ] Create test script to ping Redis
  - [ ] Verify read/write operations

---

## Core Configuration Phase

### 4. Environment & Configuration ⏱️ 1-2 hours

- [ ] **4.1** Create environment validation
  - [ ] Create `src/config/env.ts`
  - [ ] Define Zod schema for env variables
  - [ ] Validate on startup
  - [ ] Export type-safe env object

- [ ] **4.2** Create Gemini AI configuration
  - [ ] Create `src/config/gemini.ts`
  - [ ] Initialize GoogleGenerativeAI client
  - [ ] Configure model (gemini-2.5-flash)

- [ ] **4.3** Create logger configuration
  - [ ] Create `src/utils/logger.ts`
  - [ ] Set up Winston logger
  - [ ] Configure file transports (error.log, combined.log)
  - [ ] Configure console transport for development
  - [ ] Add log levels

---

## Utilities & Types Phase

### 5. Type Definitions ⏱️ 2 hours

- [ ] **5.1** Create type files
  - [ ] Create `src/types/express.d.ts` (extend Express Request)
  - [ ] Create `src/types/auth.types.ts`
  - [ ] Create `src/types/dictionary.types.ts`
  - [ ] Create `src/types/llm.types.ts`
  - [ ] Create `src/types/api.types.ts`

- [ ] **5.2** Define response interfaces
  - [ ] ApiResponse<T>
  - [ ] ApiError
  - [ ] PaginationMeta

---

### 6. Utility Functions ⏱️ 2-3 hours

- [ ] **6.1** Create error utilities
  - [ ] Create `src/utils/errors.ts`
  - [ ] Define custom error classes (NotFoundError, ValidationError, etc.)
  - [ ] Define error codes enum

- [ ] **6.2** Create validation utilities
  - [ ] Create `src/utils/validation.ts`
  - [ ] Define Zod schemas for common validations
  - [ ] Email validation
  - [ ] Password validation
  - [ ] UUID validation

- [ ] **6.3** Create hash utilities
  - [ ] Create `src/utils/hash.ts`
  - [ ] Implement bcrypt hashing
  - [ ] Implement password comparison

- [ ] **6.4** Create JWT utilities
  - [ ] Create `src/utils/jwt.ts`
  - [ ] Generate access token function
  - [ ] Generate refresh token function
  - [ ] Verify token function
  - [ ] Decode token function

- [ ] **6.5** Create transformation utilities
  - [ ] Create `src/utils/transform.ts`
  - [ ] Transform Free Dictionary API response
  - [ ] Transform database models to API responses

---

## Middleware Phase

### 7. Middleware Implementation ⏱️ 3-4 hours

- [ ] **7.1** Create authentication middleware
  - [ ] Create `src/middleware/auth.ts`
  - [ ] Extract token from Authorization header
  - [ ] Verify JWT token
  - [ ] Attach user to request object
  - [ ] Handle token expiration errors

- [ ] **7.2** Create authorization middleware
  - [ ] Add `requireAdmin` middleware
  - [ ] Check user role

- [ ] **7.3** Create validation middleware
  - [ ] Create `src/middleware/validation.ts`
  - [ ] Generic Zod validation middleware
  - [ ] Validate body, query, params

- [ ] **7.4** Create error handler middleware
  - [ ] Create `src/middleware/errorHandler.ts`
  - [ ] Convert errors to ApiError format
  - [ ] Log errors
  - [ ] Send appropriate HTTP status codes

- [ ] **7.5** Create rate limiting middleware
  - [ ] Create `src/middleware/rateLimiter.ts`
  - [ ] Configure Redis store
  - [ ] Create general limiter
  - [ ] Create auth limiter
  - [ ] Create LLM limiter
  - [ ] Create custom per-user rate limiter

- [ ] **7.6** Create CORS middleware
  - [ ] Create `src/middleware/cors.ts`
  - [ ] Configure allowed origins from env
  - [ ] Enable credentials

---

## Services Layer Phase

### 8. Cache Service ⏱️ 2-3 hours

- [ ] **8.1** Create cache service
  - [ ] Create `src/services/cache.service.ts`
  - [ ] Implement get/set/delete methods
  - [ ] Implement setex (with TTL)
  - [ ] Implement cache key generators
  - [ ] Handle JSON serialization
  - [ ] Add error handling with fallbacks

---

### 9. Session Service ⏱️ 2 hours

- [ ] **9.1** Create session service
  - [ ] Create `src/services/session.service.ts`
  - [ ] Implement createSession (Redis)
  - [ ] Implement getSession
  - [ ] Implement deleteSession
  - [ ] Track user's active sessions (Redis Set)
  - [ ] Implement logout all sessions

---

### 10. User & Auth Service ⏱️ 4-5 hours

- [ ] **10.1** Create user service
  - [ ] Create `src/services/user.service.ts`
  - [ ] Implement createUser
  - [ ] Implement getUserById
  - [ ] Implement getUserByEmail
  - [ ] Implement updateUser
  - [ ] Add Redis caching for user data

- [ ] **10.2** Create auth service
  - [ ] Create `src/services/auth.service.ts`
  - [ ] Implement register
    - Validate email uniqueness
    - Hash password
    - Create user in database
    - Generate tokens
    - Create session
  - [ ] Implement login
    - Validate credentials
    - Compare password hash
    - Generate tokens
    - Create session
  - [ ] Implement refresh token
    - Validate refresh token from Redis
    - Generate new token pair
    - Update session
  - [ ] Implement logout
    - Delete session from Redis
  - [ ] Implement getCurrentUser

---

### 11. Dictionary Service ⏱️ 6-8 hours

- [ ] **11.1** Create Free Dictionary API service
  - [ ] Create `src/services/freeDictionary.service.ts`
  - [ ] Implement fetchWordDefinition
  - [ ] Add axios retry logic
  - [ ] Transform API response to our schema
  - [ ] Handle 404 errors
  - [ ] Add request delay (respectful rate limiting)

- [ ] **11.2** Create dictionary service
  - [ ] Create `src/services/dictionary.service.ts`
  - [ ] Implement multi-layer caching lookup:
    - Layer 1: Check Redis cache
    - Layer 2: Check PostgreSQL cache
    - Layer 3: Query Free Dictionary API
    - Layer 4: Fallback to Gemini AI
  - [ ] Implement searchDictionary
  - [ ] Implement addWordToDictionary (admin)
  - [ ] Implement refreshCacheEntry (admin)
  - [ ] Add cache invalidation

---

### 12. My Words Service ⏱️ 3-4 hours

- [ ] **12.1** Create my words service
  - [ ] Create `src/services/myWords.service.ts`
  - [ ] Implement getUserWords (paginated)
  - [ ] Implement addWordToUserDictionary
  - [ ] Implement removeWordFromUserDictionary
  - [ ] Implement searchUserWords
  - [ ] Check for duplicate words
  - [ ] Add Redis caching for frequently accessed words

---

### 13. LLM Service ⏱️ 6-8 hours

- [ ] **13.1** Create LLM service
  - [ ] Create `src/services/llm.service.ts`
  - [ ] Implement correctText
    - Generate cache key (hash of input)
    - Check Redis cache
    - Call Gemini API if cache miss
    - Parse AI response
    - Cache result
    - Track usage in AIUsageLog
  - [ ] Implement defineWord
    - Use Gemini for obscure words
    - Return structured definition
  - [ ] Implement generateSuggestions
  - [ ] Implement analyzeWritingStyle
  - [ ] Create prompt templates for each function
  - [ ] Add error handling for API failures
  - [ ] Implement retry logic

---

### 14. Settings Service ⏱️ 2 hours

- [ ] **14.1** Create settings service
  - [ ] Create `src/services/settings.service.ts`
  - [ ] Implement getUserSettings
  - [ ] Implement updateUserSettings
  - [ ] Auto-create settings on user registration
  - [ ] Add Redis caching

---

## Controllers Layer Phase

### 15. Controllers Implementation ⏱️ 6-8 hours

- [ ] **15.1** Create auth controller
  - [ ] Create `src/controllers/auth.controller.ts`
  - [ ] Implement register handler
  - [ ] Implement login handler
  - [ ] Implement refresh handler
  - [ ] Implement logout handler
  - [ ] Implement getCurrentUser handler

- [ ] **15.2** Create dictionary controller
  - [ ] Create `src/controllers/dictionary.controller.ts`
  - [ ] Implement searchDictionary handler
  - [ ] Implement getWordDefinition handler
  - [ ] Implement getFullWordData handler
  - [ ] Implement addWord handler (admin)

- [ ] **15.3** Create my words controller
  - [ ] Create `src/controllers/myWords.controller.ts`
  - [ ] Implement getUserWords handler
  - [ ] Implement addWord handler
  - [ ] Implement removeWord handler
  - [ ] Implement searchWords handler

- [ ] **15.4** Create LLM controller
  - [ ] Create `src/controllers/llm.controller.ts`
  - [ ] Implement correctText handler
  - [ ] Implement defineWord handler
  - [ ] Implement generateSuggestions handler
  - [ ] Implement analyzeWritingStyle handler

- [ ] **15.5** Create settings controller
  - [ ] Create `src/controllers/settings.controller.ts`
  - [ ] Implement getSettings handler
  - [ ] Implement updateSettings handler

- [ ] **15.6** Create health controller
  - [ ] Create `src/controllers/health.controller.ts`
  - [ ] Check database connection
  - [ ] Check Redis connection
  - [ ] Check external APIs (Free Dictionary, Gemini)
  - [ ] Return cache metrics
  - [ ] Return performance metrics

---

## Routes Layer Phase

### 16. Routes Implementation ⏱️ 3-4 hours

- [ ] **16.1** Create auth routes
  - [ ] Create `src/routes/auth.routes.ts`
  - [ ] POST /auth/register
  - [ ] POST /auth/login
  - [ ] POST /auth/refresh
  - [ ] POST /auth/logout (protected)
  - [ ] GET /auth/me (protected)

- [ ] **16.2** Create dictionary routes
  - [ ] Create `src/routes/dictionary.routes.ts`
  - [ ] GET /dictionary/search (protected)
  - [ ] GET /dictionary/word/:word (protected)
  - [ ] GET /dictionary/word/:word/full (protected)
  - [ ] POST /dictionary/words (admin)

- [ ] **16.3** Create my words routes
  - [ ] Create `src/routes/myWords.routes.ts`
  - [ ] GET /my-words (protected)
  - [ ] POST /my-words (protected)
  - [ ] DELETE /my-words/:id (protected)
  - [ ] GET /my-words/search (protected)

- [ ] **16.4** Create LLM routes
  - [ ] Create `src/routes/llm.routes.ts`
  - [ ] POST /llm/correct (protected, rate-limited)
  - [ ] POST /llm/define (protected, rate-limited)
  - [ ] POST /llm/suggest (protected, rate-limited)
  - [ ] POST /llm/analyze (protected, rate-limited)

- [ ] **16.5** Create settings routes
  - [ ] Create `src/routes/settings.routes.ts`
  - [ ] GET /settings (protected)
  - [ ] PATCH /settings (protected)

- [ ] **16.6** Create health routes
  - [ ] Create `src/routes/health.routes.ts`
  - [ ] GET /health (public)

- [ ] **16.7** Create main router
  - [ ] Create `src/routes/index.ts`
  - [ ] Combine all sub-routers
  - [ ] Add /api prefix
  - [ ] Add versioning support

---

## Application Setup Phase

### 17. Express App Setup ⏱️ 2-3 hours

- [ ] **17.1** Create Express app
  - [ ] Create `src/app.ts`
  - [ ] Initialize Express
  - [ ] Add body parser middleware
  - [ ] Add CORS middleware
  - [ ] Add Morgan logging middleware
  - [ ] Add rate limiting middleware
  - [ ] Register routes
  - [ ] Add 404 handler
  - [ ] Add error handler middleware
  - [ ] Export app

- [ ] **17.2** Create server entry point
  - [ ] Create `src/server.ts`
  - [ ] Import app
  - [ ] Connect to database
  - [ ] Connect to Redis
  - [ ] Start HTTP server
  - [ ] Add graceful shutdown
  - [ ] Handle SIGTERM/SIGINT

---

## Background Jobs Phase

### 18. Cron Jobs ⏱️ 2-3 hours

- [ ] **18.1** Create cache cleanup job
  - [ ] Create `src/jobs/cacheCleanup.ts`
  - [ ] Delete expired PostgreSQL cache entries
  - [ ] Log cleanup results

- [ ] **18.2** Create job scheduler
  - [ ] Create `src/jobs/scheduler.ts`
  - [ ] Schedule cache cleanup (daily at 2 AM)
  - [ ] Add job monitoring/logging
  - [ ] Export job starter function

- [ ] **18.3** Integrate jobs with server
  - [ ] Start jobs on server startup

---

## Testing Phase

### 19. Unit Tests ⏱️ 8-10 hours

- [ ] **19.1** Set up test environment
  - [ ] Create `tests/setup.ts`
  - [ ] Create test database configuration
  - [ ] Create test helpers

- [ ] **19.2** Test utilities
  - [ ] Test hash functions
  - [ ] Test JWT functions
  - [ ] Test validation schemas
  - [ ] Test transformation functions

- [ ] **19.3** Test services
  - [ ] Test auth service
  - [ ] Test dictionary service
  - [ ] Test LLM service
  - [ ] Test cache service
  - [ ] Test session service

- [ ] **19.4** Test middleware
  - [ ] Test auth middleware
  - [ ] Test validation middleware
  - [ ] Test error handler

---

### 20. Integration Tests ⏱️ 6-8 hours

- [ ] **20.1** Test auth endpoints
  - [ ] Create `tests/integration/auth.test.ts`
  - [ ] Test registration flow
  - [ ] Test login flow
  - [ ] Test token refresh
  - [ ] Test logout
  - [ ] Test protected endpoints

- [ ] **20.2** Test dictionary endpoints
  - [ ] Create `tests/integration/dictionary.test.ts`
  - [ ] Test search
  - [ ] Test word lookup
  - [ ] Test caching behavior
  - [ ] Test admin operations

- [ ] **20.3** Test my words endpoints
  - [ ] Create `tests/integration/myWords.test.ts`
  - [ ] Test CRUD operations
  - [ ] Test pagination
  - [ ] Test search

- [ ] **20.4** Test LLM endpoints
  - [ ] Create `tests/integration/llm.test.ts`
  - [ ] Test correction endpoint
  - [ ] Test caching
  - [ ] Test rate limiting

---

## Database Seeding Phase

### 21. Database Seeding ⏱️ 2-3 hours

- [ ] **21.1** Create seed script
  - [ ] Create `prisma/seed.ts`
  - [ ] Create admin user
  - [ ] Create test users
  - [ ] Seed common dictionary words (top 1000 English words)
  - [ ] Create sample user settings

- [ ] **21.2** Add seed script to package.json
  ```json
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
  ```

- [ ] **21.3** Run seed
  ```bash
  npm run db:seed
  ```

---

## Documentation Phase

### 22. Documentation ⏱️ 3-4 hours

- [ ] **22.1** Create README.md
  - [ ] Project overview
  - [ ] Prerequisites
  - [ ] Installation steps
  - [ ] Running locally
  - [ ] Running with Docker
  - [ ] Testing
  - [ ] Environment variables
  - [ ] API documentation link

- [ ] **22.2** Create API documentation
  - [ ] Consider using Swagger/OpenAPI
  - [ ] Or create detailed API.md
  - [ ] Document all endpoints
  - [ ] Include example requests/responses

- [ ] **22.3** Add inline code documentation
  - [ ] Add JSDoc comments to services
  - [ ] Add JSDoc comments to utilities
  - [ ] Document complex logic

---

## Production Preparation Phase

### 23. Production Setup ⏱️ 4-5 hours

- [ ] **23.1** Create Dockerfile
  - [ ] Multi-stage build
  - [ ] Production dependencies only
  - [ ] Optimize image size

- [ ] **23.2** Update docker-compose for production
  - [ ] Production environment variables
  - [ ] Resource limits
  - [ ] Health checks
  - [ ] Restart policies

- [ ] **23.3** Security hardening
  - [ ] Helmet.js for security headers
  - [ ] Rate limiting production values
  - [ ] Environment variable validation
  - [ ] HTTPS enforcement
  - [ ] SQL injection prevention check
  - [ ] XSS prevention check

- [ ] **23.4** Performance optimization
  - [ ] Database connection pooling
  - [ ] Redis connection pooling
  - [ ] Compression middleware
  - [ ] Response caching headers

- [ ] **23.5** Monitoring setup
  - [ ] Add health check endpoint
  - [ ] Add metrics endpoint
  - [ ] Configure Winston for production logging
  - [ ] Set up log rotation

---

## Deployment Phase

### 24. Deployment ⏱️ 2-3 hours

- [ ] **24.1** Choose hosting platform
  - [ ] Railway / Render / Heroku
  - [ ] Or VPS (DigitalOcean, AWS, etc.)

- [ ] **24.2** Set up PostgreSQL
  - [ ] Managed PostgreSQL service
  - [ ] Or self-hosted

- [ ] **24.3** Set up Redis
  - [ ] Managed Redis service (Upstash, Redis Cloud)
  - [ ] Or self-hosted

- [ ] **24.4** Deploy backend
  - [ ] Push to GitHub
  - [ ] Connect to hosting platform
  - [ ] Set environment variables
  - [ ] Run database migrations
  - [ ] Verify deployment

- [ ] **24.5** Post-deployment
  - [ ] Test all endpoints
  - [ ] Monitor logs
  - [ ] Check performance metrics
  - [ ] Test error scenarios

---

## Total Estimated Time

| Phase | Hours |
|-------|-------|
| Project Setup | 2 |
| Database Setup | 3 |
| Redis Setup | 1 |
| Configuration | 2 |
| Types & Utilities | 7 |
| Middleware | 4 |
| Services | 25 |
| Controllers | 8 |
| Routes | 4 |
| App Setup | 3 |
| Background Jobs | 3 |
| Testing | 18 |
| Database Seeding | 3 |
| Documentation | 4 |
| Production Prep | 5 |
| Deployment | 3 |
| **Total** | **~95 hours** |

**Estimated Timeline:** 2-3 weeks for one developer

---

## Priority Levels

### Phase 1 - MVP (Must Have) ⭐⭐⭐
1. Project Setup
2. Database Setup
3. Redis Setup
4. Core Configuration
5. Types & Utilities
6. Authentication (Middleware, Service, Controller, Routes)
7. Dictionary Service (basic lookup)
8. App Setup

### Phase 2 - Core Features ⭐⭐
9. LLM Service (correction endpoint)
10. My Words Service
11. Settings Service
12. Health Check
13. Basic Testing
14. Documentation

### Phase 3 - Enhancements ⭐
15. Background Jobs
16. Comprehensive Testing
17. Production Preparation
18. Deployment
19. Advanced LLM features
20. Admin features

---

## Daily Development Plan (Example)

### Week 1
- **Day 1-2:** Project setup, database, Redis, configuration
- **Day 3-4:** Types, utilities, middleware
- **Day 5:** Authentication service + routes

### Week 2
- **Day 1-2:** Dictionary service with multi-layer caching
- **Day 3:** My Words service
- **Day 4:** LLM service (basic)
- **Day 5:** Settings service + health check

### Week 3
- **Day 1-2:** Testing (unit + integration)
- **Day 3:** Background jobs + documentation
- **Day 4:** Production preparation
- **Day 5:** Deployment + final testing

---

## Quick Start Checklist

For a quick MVP in 1 week:

- [ ] Set up project + database + Redis (Day 1)
- [ ] Create utilities + middleware (Day 1-2)
- [ ] Implement auth (Day 2)
- [ ] Implement dictionary service (Day 3)
- [ ] Implement LLM correction (Day 4)
- [ ] Add basic tests (Day 5)
- [ ] Deploy (Day 5)

---

**Last Updated:** 2024-11-30
**Version:** 1.0
