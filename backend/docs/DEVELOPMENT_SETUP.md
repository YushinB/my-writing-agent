# Development Setup Guide

## Quick Start

This guide will help you set up the ProsePolish development environment on your local machine.

## Prerequisites

- **Node.js** 20.x or higher
- **npm** or **yarn**
- **Docker Desktop** (for PostgreSQL and Redis)
- **Git**

## Step 1: Clone the Repository

```bash
git clone https://github.com/YushinB/my-writing-agent.git
cd my-writing-agent
```

## Step 2: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd ../frontend
npm install
```

## Step 3: Set Up Environment Variables

### Backend Configuration

1. Create `.env` file in the `backend` directory:
   ```bash
   cp .env.example .env
   ```

2. Edit `backend/.env` with your configuration:
   ```env
   # Node Environment
   NODE_ENV=development

   # Server Configuration
   PORT=3000
   API_VERSION=v1

   # Database Configuration (Docker)
   DATABASE_URL=postgresql://postgres:TestPass123SecureDB2024!@localhost:5432/prosepolish_db?schema=public

   # Redis Configuration (Docker)
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=TestRedis789Secure2024!
   REDIS_DB=0

   # JWT Configuration
   JWT_ACCESS_SECRET=your-super-secret-jwt-access-key-min-32-chars
   JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key-min-32-chars
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # Gemini AI Configuration
   GEMINI_API_KEY=your-gemini-api-key-here

   # Rate Limiting (Development - More Relaxed)
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   RATE_LIMIT_AUTH_MAX=50
   RATE_LIMIT_LLM_MAX=20

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000,http://localhost:8080

   # Admin Account (Auto-created on first run)
   ADMIN_EMAIL=admin@prosepolish.com
   ADMIN_PASSWORD=Tsvs7345SecureAdmin2024!
   ADMIN_NAME=Admin User
   ```

### Frontend Configuration

1. Create `.env` file in the `frontend` directory:
   ```bash
   cp .env.example .env
   ```

2. Edit `frontend/.env`:
   ```env
   REACT_APP_API_URL=http://localhost:3000/api/v1
   ```

## Step 4: Start Docker Services

### Using Docker Compose (Recommended)

Start PostgreSQL and Redis containers:

```bash
cd backend
docker-compose up -d postgres redis
```

This will start:
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`

Verify containers are running:
```bash
docker ps
```

You should see:
```
CONTAINER ID   IMAGE                PORTS
xxxxx          postgres:16-alpine   0.0.0.0:5432->5432/tcp
xxxxx          redis:7-alpine       0.0.0.0:6379->6379/tcp
```

### Manual Docker Setup (Alternative)

If you prefer to run containers manually:

```bash
# PostgreSQL
docker run -d \
  --name prosepolish_postgres_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=TestPass123SecureDB2024! \
  -e POSTGRES_DB=prosepolish_db \
  -p 5432:5432 \
  postgres:16-alpine

# Redis
docker run -d \
  --name prosepolish_redis_dev \
  -e REDIS_PASSWORD=TestRedis789Secure2024! \
  -p 6379:6379 \
  redis:7-alpine redis-server --requirepass TestRedis789Secure2024!
```

## Step 5: Database Setup

### Run Migrations

```bash
cd backend
npx prisma migrate dev
```

This will:
- Create the database schema
- Apply all migrations
- Generate Prisma Client

### Seed Development Data

```bash
npm run db:seed
```

This creates:
- Test user: `yushin@prosepolish.com` / `TestPass123!`
- Admin user: `admin@prosepolish.com` / `Tsvs7345SecureAdmin2024!`
- Sample dictionary entries
- Sample saved words

## Step 6: Start Development Servers

### Option 1: Start Everything (Recommended)

Start backend and frontend concurrently:

```bash
# From the root directory
npm run dev
```

### Option 2: Start Individually

**Backend:**
```bash
cd backend
npm run dev
```

Backend will start on `http://localhost:3000`

**Frontend:**
```bash
cd frontend
npm run dev
```

Frontend will start on `http://localhost:8080`

## Step 7: Verify Installation

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

   Expected response:
   ```json
   {
     "success": true,
     "data": {
       "status": "healthy",
       "services": {
         "database": true,
         "redis": true
       }
     }
   }
   ```

2. **Access Frontend:**
   Open `http://localhost:8080` in your browser

3. **Login:**
   - Test User: `yushin@prosepolish.com` / `TestPass123!`
   - Admin User: `admin@prosepolish.com` / `Tsvs7345SecureAdmin2024!`

## Development Workflow

### Hot Reloading

Both servers support hot reloading:
- **Backend**: Uses `nodemon` - auto-restarts on file changes
- **Frontend**: Uses `webpack-dev-server` - hot module replacement

### Database Management

#### View Database with Prisma Studio
```bash
cd backend
npx prisma studio
```

Opens at `http://localhost:5555`

#### Reset Database
```bash
cd backend
npx prisma migrate reset
```

This will:
- Drop the database
- Recreate it
- Run all migrations
- Run seed script

#### Generate Prisma Client (after schema changes)
```bash
cd backend
npx prisma generate
```

### Clear Rate Limiting (if blocked)

If you get rate-limited during development:

```bash
docker exec prosepolish_redis_dev redis-cli -a "TestRedis789Secure2024!" --no-auth-warning FLUSHDB
```

Or increase limits in `.env`:
```env
RATE_LIMIT_AUTH_MAX=100  # Default is 5
```

## Common Development Tasks

### Run Tests

**Backend:**
```bash
cd backend
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

**Frontend:**
```bash
cd frontend
npm test
```

### Linting and Formatting

**Backend:**
```bash
cd backend
npm run lint            # Check for issues
npm run lint:fix        # Auto-fix issues
npm run format          # Format with Prettier
```

**Frontend:**
```bash
cd frontend
npm run lint
npm run lint:fix
```

### Build for Production

**Backend:**
```bash
cd backend
npm run build
```

Outputs to `backend/dist/`

**Frontend:**
```bash
cd frontend
npm run build
```

Outputs to `frontend/dist/`

### API Documentation

Swagger API docs available at:
```
http://localhost:3000/api-docs
```

## Troubleshooting

### Port Already in Use

**Backend (Port 3000):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

**Frontend (Port 8080):**
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill
```

### Database Connection Issues

1. Check Docker containers are running:
   ```bash
   docker ps
   ```

2. Check PostgreSQL logs:
   ```bash
   docker logs prosepolish_postgres_dev
   ```

3. Verify DATABASE_URL in `.env` matches Docker container settings

### Redis Connection Issues

1. Test Redis connection:
   ```bash
   docker exec prosepolish_redis_dev redis-cli -a "TestRedis789Secure2024!" PING
   ```

   Should return: `PONG`

2. Check Redis logs:
   ```bash
   docker logs prosepolish_redis_dev
   ```

### Prisma Client Issues

If you see "Prisma Client not found" errors:

```bash
cd backend
npx prisma generate
```

### Module Not Found Errors

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Rate Limit Errors

Clear rate limit data:
```bash
docker exec prosepolish_redis_dev redis-cli -a "TestRedis789Secure2024!" --no-auth-warning KEYS "rl:*" | xargs docker exec prosepolish_redis_dev redis-cli -a "TestRedis789Secure2024!" --no-auth-warning DEL
```

## Docker Commands Reference

### Start Services
```bash
cd backend
docker-compose up -d        # Start all services
docker-compose up -d postgres  # Start only PostgreSQL
docker-compose up -d redis     # Start only Redis
```

### Stop Services
```bash
docker-compose down              # Stop all services
docker-compose down -v           # Stop and remove volumes (deletes data!)
```

### View Logs
```bash
docker-compose logs              # All services
docker-compose logs backend      # Backend only
docker-compose logs -f postgres  # Follow PostgreSQL logs
```

### Execute Commands in Containers
```bash
# PostgreSQL
docker exec -it prosepolish_postgres_dev psql -U postgres -d prosepolish_db

# Redis
docker exec -it prosepolish_redis_dev redis-cli -a "TestRedis789Secure2024!"
```

### Restart Services
```bash
docker-compose restart
docker-compose restart backend
```

## Environment Variables Reference

### Backend Essential Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_HOST` | Redis hostname | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_ACCESS_SECRET` | JWT signing key | Required (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token key | Required (min 32 chars) |
| `GEMINI_API_KEY` | Google Gemini API key | Required for AI features |
| `ADMIN_EMAIL` | Default admin email | Required for seeding |
| `ADMIN_PASSWORD` | Default admin password | Required for seeding |

### Frontend Essential Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:3000/api/v1` |

## IDE Configuration

### VS Code

Recommended extensions:
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **Prisma** - Prisma schema syntax
- **Docker** - Docker support
- **GitLens** - Git visualization

### Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": ["javascript", "typescript"],
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Next Steps

- [API Documentation](API.md) - Explore available endpoints
- [Architecture Guide](DESIGN.md) - Understand the codebase structure
- [Production Setup](PRODUCTION_SETUP.md) - Deploy to production
- [Development Tasks](DEVELOPMENT_TASKS.md) - Current development roadmap

## Getting Help

- Check existing issues on GitHub
- Review API documentation at `http://localhost:3000/api-docs`
- Check backend logs in `backend/logs/`
- Use Prisma Studio to inspect database

## Best Practices

1. **Always run migrations** before starting development
2. **Keep dependencies updated** regularly
3. **Run tests** before committing
4. **Clear Redis cache** if you see stale data
5. **Use TypeScript strictly** - avoid `any` types
6. **Follow commit conventions** - use semantic commit messages
7. **Never commit** `.env` files or credentials
