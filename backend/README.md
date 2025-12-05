# ProsePolish Backend

AI-Powered Writing Assistant Backend built with Express.js, Prisma, PostgreSQL, Redis, and TypeScript.

## Overview

ProsePolish Backend is a comprehensive RESTful API that powers an AI-driven writing assistant application. It provides intelligent text correction, dictionary services, personalized word management, and advanced writing analysis using Google's Gemini AI.

## Features

- AI-Powered Text Correction using Gemini AI
- Smart Multi-layer Dictionary with caching
- Personal Word Collections
- Writing Style Analysis
- JWT Authentication & Authorization
- Redis-based Session Management
- Rate Limiting & Usage Tracking
- Background Jobs for Maintenance

## Tech Stack

- Node.js 20+ & TypeScript 5.x
- Express.js 5.x
- Prisma 6.x (PostgreSQL 16)
- Redis 7.x
- Google Gemini 2.0 Flash
- Jest & Supertest

## Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start services
docker-compose up -d postgres redis

# Initialize database
npm run db:migrate
npm run db:generate
npm run db:seed
```

## Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Testing

```bash
npm test                 # Run all tests
npm run test:coverage    # With coverage
```

Current: 6 test suites, 48 tests passed, 5 skipped

## API Endpoints

### Authentication
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- GET /api/v1/auth/me

### Dictionary
- GET /api/v1/dictionary/word/:word
- GET /api/v1/dictionary/search

### LLM
- POST /api/v1/llm/correct
- POST /api/v1/llm/analyze

### My Words
- GET /api/v1/my-words
- POST /api/v1/my-words

See [docs/API.md](./docs/API.md) for complete documentation.

## Scripts

```bash
npm run dev              # Dev server
npm run build            # Build
npm test                 # Run tests
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Prisma Studio
```

## Project Structure

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

## License

MIT License

---

**Built with ❤️ using TypeScript, Express, and Gemini AI**
