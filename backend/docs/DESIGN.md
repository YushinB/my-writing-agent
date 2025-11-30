# Backend API Design Document

## ProsePolish Backend Architecture

**Stack:** Express.js + Prisma + PostgreSQL + TypeScript

---

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [External Services Integration](#external-services-integration)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Authentication & Authorization](#authentication--authorization)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)
9. [Environment Variables](#environment-variables)

---

## Overview

The ProsePolish backend is a RESTful API server that provides:
- User authentication and authorization
- Dictionary management (integrates with Free Dictionary API + user's saved words)
- AI-powered writing assistance using LLM models (Gemini)
- User settings management
- Multi-user support with role-based access control
- External dictionary data caching for improved performance

---

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | >=18.0.0 |
| Framework | Express.js | ^4.18.0 |
| ORM | Prisma | ^5.0.0 |
| Database | PostgreSQL | ^15.0 |
| Language | TypeScript | ~5.8.0 |
| Authentication | JWT | ^9.0.0 |
| Password Hashing | bcrypt | ^5.1.0 |
| Validation | Zod | ^3.22.0 |
| LLM Integration | @google/generative-ai | ^1.30.0 |
| HTTP Client | axios | ^1.6.0 |
| Dictionary API | Free Dictionary API | - |
| Cron Jobs | node-cron | ^3.0.0 |
| Cache | Redis | ^7.0.0 |
| Redis Client | ioredis | ^5.3.0 |
| Rate Limiting | express-rate-limit | ^7.1.0 |
| Rate Limit Store | rate-limit-redis | ^4.2.0 |

---

## External Services Integration

### Redis Cache

**Purpose:** In-memory cache layer for high-performance data access and session management.

**Use Cases:**
1. **Dictionary Cache:** Frequently accessed word definitions
2. **Session Storage:** JWT refresh tokens and user sessions
3. **Rate Limiting:** Track API request counts per user
4. **LLM Response Cache:** Cache AI-generated corrections for identical text
5. **API Response Cache:** Cache expensive database queries

**Configuration:**

```typescript
// config/redis.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

export default redis;
```

**Cache Strategy:**

```typescript
// Multi-layer caching for dictionary lookups
async function getWordDefinition(word: string) {
  const cacheKey = `dict:${word.toLowerCase()}`;

  // Layer 1: Redis (in-memory, fastest)
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Layer 2: PostgreSQL (persistent)
  const dbEntry = await db.dictionaryEntry.findUnique({
    where: { word: word.toLowerCase() }
  });

  if (dbEntry && dbEntry.cacheExpiresAt > new Date()) {
    // Cache in Redis for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(dbEntry));
    return dbEntry;
  }

  // Layer 3: Free Dictionary API
  const apiResult = await fetchFromDictionaryAPI(word);

  // Cache in both Redis and PostgreSQL
  await redis.setex(cacheKey, 3600, JSON.stringify(apiResult));
  await db.dictionaryEntry.upsert({
    where: { word: word.toLowerCase() },
    update: { ...apiResult, cacheExpiresAt: addDays(new Date(), 30) },
    create: { ...apiResult, cacheExpiresAt: addDays(new Date(), 30) }
  });

  return apiResult;
}
```

**Cache Keys Structure:**

| Prefix | Purpose | TTL | Example |
|--------|---------|-----|---------|
| `dict:` | Dictionary entries | 1 hour | `dict:eloquent` |
| `user:` | User data | 15 min | `user:uuid-123` |
| `session:` | Refresh tokens | 7 days | `session:refresh-token-xyz` |
| `ratelimit:` | Rate limiting | 15 min | `ratelimit:user-123:llm` |
| `llm:` | LLM responses | 24 hours | `llm:hash-of-input-text` |
| `settings:` | User settings | 1 hour | `settings:user-123` |

**Cache Invalidation:**

```typescript
// Invalidate user cache on profile update
async function updateUserProfile(userId: string, data: any) {
  await db.user.update({ where: { id: userId }, data });

  // Invalidate Redis cache
  await redis.del(`user:${userId}`);
  await redis.del(`settings:${userId}`);
}

// Invalidate dictionary cache (admin action)
async function refreshDictionaryEntry(word: string) {
  await redis.del(`dict:${word.toLowerCase()}`);
  await db.dictionaryEntry.delete({
    where: { word: word.toLowerCase() }
  });
}
```

---

### Free Dictionary API

**Base URL:** `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`

**Purpose:** Provides comprehensive word definitions, pronunciations, examples, and synonyms from a free, open-source dictionary API.

**Features:**
- No API key required
- Multiple definitions per word
- Phonetic pronunciations (text and audio)
- Part of speech classifications
- Example sentences
- Synonyms and antonyms
- Etymology information

**Response Structure:**
```json
[
  {
    "word": "hello",
    "phonetic": "/həˈloʊ/",
    "phonetics": [
      {
        "text": "/həˈloʊ/",
        "audio": "https://api.dictionaryapi.dev/media/pronunciations/en/hello-au.mp3"
      }
    ],
    "meanings": [
      {
        "partOfSpeech": "exclamation",
        "definitions": [
          {
            "definition": "Used as a greeting or to begin a phone conversation.",
            "example": "hello there, Katie!",
            "synonyms": ["hi", "hey"],
            "antonyms": ["goodbye"]
          }
        ]
      }
    ]
  }
]
```

**Integration Strategy:**

1. **Cache-First Approach:**
   - First check local PostgreSQL database cache
   - If not found, query Free Dictionary API
   - Cache successful responses in database
   - Cache TTL: 30 days (dictionary entries rarely change)

2. **Error Handling:**
   - API returns 404 if word not found
   - Fallback to Gemini AI for obscure/technical terms
   - Log failed lookups for manual review

3. **Rate Limiting:**
   - No official rate limit, but implement respectful delays
   - Use in-memory cache (Redis/Node-cache) for frequently accessed words
   - Batch requests with 100ms delay between calls

**Data Transformation:**
The Free Dictionary API response will be transformed to match our `DictionaryEntry` schema:
```typescript
interface FreeDictionaryResponse {
  word: string;
  phonetic?: string;
  phonetics: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
  }>;
}

// Transform to our schema
function transformFreeDictionaryData(data: FreeDictionaryResponse[]): DictionaryEntry {
  const firstEntry = data[0];
  const firstMeaning = firstEntry.meanings[0];
  const firstDefinition = firstMeaning.definitions[0];

  return {
    word: firstEntry.word,
    definition: firstDefinition.definition,
    partOfSpeech: firstMeaning.partOfSpeech,
    exampleSentence: firstDefinition.example || '',
    synonyms: firstDefinition.synonyms || [],
    pronunciation: firstEntry.phonetic || firstEntry.phonetics[0]?.text || '',
    // Store full response in metadata field for rich data
  };
}
```

---

## Database Schema

### Users Table
```prisma
model User {
  id            String       @id @default(uuid())
  email         String       @unique
  password      String       // hashed with bcrypt
  name          String
  role          UserRole     @default(USER)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  // Relations
  savedWords    SavedWord[]
  settings      UserSettings?
  sessions      Session[]

  @@index([email])
}

enum UserRole {
  USER
  ADMIN
}
```

### SavedWord Table (User's Personal Dictionary)
```prisma
model SavedWord {
  id              String    @id @default(uuid())
  userId          String
  word            String
  definition      String    @db.Text
  partOfSpeech    String
  exampleSentence String    @db.Text
  synonyms        String[]  // Array of strings
  dateAdded       DateTime  @default(now())

  // Relations
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, word])
  @@index([userId])
  @@index([word])
}
```

### DictionaryEntry Table (Public Dictionary Cache)
```prisma
model DictionaryEntry {
  id              String    @id @default(uuid())
  word            String    @unique
  definition      String    @db.Text
  partOfSpeech    String
  exampleSentence String    @db.Text
  synonyms        String[]
  pronunciation   String?   // IPA
  difficulty      String?   // beginner, intermediate, advanced
  audioUrl        String?   // URL to pronunciation audio from Free Dictionary API
  source          String    @default("freedictionary") // freedictionary, manual, gemini
  metadata        Json?     // Store full Free Dictionary API response for rich data
  cacheExpiresAt  DateTime? // Cache expiration (30 days from creation)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([word])
  @@index([difficulty])
  @@index([source])
  @@index([cacheExpiresAt])
}
```

### UserSettings Table
```prisma
model UserSettings {
  id          String    @id @default(uuid())
  userId      String    @unique
  fontFamily  String    @default("inter")
  aiModel     String    @default("gemini-2.5-flash")
  theme       String    @default("light")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Session Management (Redis-based)

**Note:** Sessions are now stored in Redis instead of PostgreSQL for better performance.

**Redis Session Structure:**
```typescript
// Session data stored in Redis
interface SessionData {
  userId: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
  createdAt: number;
}

// Store session with automatic expiration
async function createSession(userId: string, refreshToken: string) {
  const sessionKey = `session:${refreshToken}`;
  const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

  const sessionData: SessionData = {
    userId,
    refreshToken,
    expiresAt,
    createdAt: Date.now()
  };

  // Store in Redis with TTL of 7 days
  await redis.setex(
    sessionKey,
    7 * 24 * 60 * 60, // 7 days in seconds
    JSON.stringify(sessionData)
  );

  // Also track user's active sessions
  await redis.sadd(`user:${userId}:sessions`, refreshToken);
}

// Retrieve session
async function getSession(refreshToken: string) {
  const sessionKey = `session:${refreshToken}`;
  const data = await redis.get(sessionKey);
  return data ? JSON.parse(data) : null;
}

// Delete session (logout)
async function deleteSession(refreshToken: string, userId: string) {
  await redis.del(`session:${refreshToken}`);
  await redis.srem(`user:${userId}:sessions`, refreshToken);
}
```

**Update User Model:**
```prisma
model User {
  id            String       @id @default(uuid())
  email         String       @unique
  password      String       // hashed with bcrypt
  name          String
  role          UserRole     @default(USER)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  // Relations
  savedWords    SavedWord[]
  settings      UserSettings?
  // sessions removed - now stored in Redis

  @@index([email])
}
```

### AIUsageLog Table (Track API usage)
```prisma
model AIUsageLog {
  id              String    @id @default(uuid())
  userId          String
  endpoint        String    // e.g., '/api/llm/correct', '/api/llm/define'
  model           String    // e.g., 'gemini-2.5-flash'
  inputTokens     Int
  outputTokens    Int
  totalCost       Decimal   @db.Decimal(10, 6)
  createdAt       DateTime  @default(now())

  @@index([userId])
  @@index([createdAt])
}
```

---

## API Endpoints

### Base URL
```
Development: http://localhost:3001/api
Production: https://api.prosepolish.com/api
```

---

## 1. Authentication API

### 1.1 Register
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

**Validation:**
- Email: valid email format, not already registered
- Password: min 8 chars, 1 uppercase, 1 lowercase, 1 number
- Name: min 2 chars, max 100 chars

---

### 1.2 Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

---

### 1.3 Refresh Token
**POST** `/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token",
    "refreshToken": "new-refresh-token"
  }
}
```

---

### 1.4 Logout
**POST** `/auth/logout`

**Headers:** `Authorization: Bearer <access-token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 1.5 Get Current User
**GET** `/auth/me`

**Headers:** `Authorization: Bearer <access-token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## 2. Dictionary Access API

### 2.1 Search Public Dictionary
**GET** `/dictionary/search`

**Query Parameters:**
- `q` (required): Search term
- `limit` (optional): Results limit (default: 10, max: 50)

**Headers:** `Authorization: Bearer <access-token>`

**Example:** `/dictionary/search?q=eloquent&limit=5`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "word": "eloquent",
      "definition": "Fluent or persuasive in speaking or writing",
      "partOfSpeech": "adjective",
      "exampleSentence": "The speaker delivered an eloquent speech.",
      "synonyms": ["articulate", "fluent", "expressive"],
      "pronunciation": "/ˈɛləkwənt/",
      "difficulty": "intermediate"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 5
  }
}
```

---

### 2.2 Get Word Definition
**GET** `/dictionary/word/:word`

**Headers:** `Authorization: Bearer <access-token>`

**Description:**
Fetches word definition using a smart, multi-source strategy:
1. First checks local database cache (fastest)
2. If not cached or expired, queries Free Dictionary API
3. If Free Dictionary API fails (404), falls back to Gemini AI
4. Caches successful responses for 30 days

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "word": "eloquent",
    "definition": "Fluent or persuasive in speaking or writing",
    "partOfSpeech": "adjective",
    "exampleSentence": "The speaker delivered an eloquent speech.",
    "synonyms": ["articulate", "fluent", "expressive"],
    "pronunciation": "/ˈɛləkwənt/",
    "audioUrl": "https://api.dictionaryapi.dev/media/pronunciations/en/eloquent-us.mp3",
    "source": "freedictionary"
  },
  "meta": {
    "cached": true,
    "cacheAge": "2 days"
  }
}
```

**Response when word not found (404):**
```json
{
  "success": false,
  "error": {
    "code": "WORD_NOT_FOUND",
    "message": "Word 'xyzabc' not found in dictionary",
    "suggestion": "Please check spelling or try a similar word"
  }
}
```

---

### 2.3 Get Rich Word Data
**GET** `/dictionary/word/:word/full`

**Headers:** `Authorization: Bearer <access-token>`

**Description:**
Returns the complete Free Dictionary API response with all definitions, meanings, and phonetics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "word": "run",
    "phonetic": "/rʌn/",
    "phonetics": [
      {
        "text": "/rʌn/",
        "audio": "https://api.dictionaryapi.dev/media/pronunciations/en/run-us.mp3"
      }
    ],
    "meanings": [
      {
        "partOfSpeech": "verb",
        "definitions": [
          {
            "definition": "To move swiftly on foot",
            "example": "I run every morning",
            "synonyms": ["sprint", "jog", "dash"],
            "antonyms": ["walk", "crawl"]
          },
          {
            "definition": "To operate or function",
            "example": "The engine runs smoothly",
            "synonyms": ["operate", "function"],
            "antonyms": []
          }
        ]
      },
      {
        "partOfSpeech": "noun",
        "definitions": [
          {
            "definition": "An act of running",
            "example": "I went for a run",
            "synonyms": ["jog", "sprint"],
            "antonyms": []
          }
        ]
      }
    ],
    "source": "freedictionary"
  }
}
```

---

### 2.4 Add Word to Public Dictionary (Admin Only)
**POST** `/dictionary/words`

**Headers:**
- `Authorization: Bearer <access-token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "word": "serendipity",
  "definition": "The occurrence of events by chance in a happy way",
  "partOfSpeech": "noun",
  "exampleSentence": "Finding that old photo was pure serendipity.",
  "synonyms": ["chance", "luck", "fortune"],
  "pronunciation": "/ˌserənˈdɪpəti/",
  "difficulty": "advanced"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "word": "serendipity",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## 3. My Words Access API

### 3.1 Get User's Saved Words
**GET** `/my-words`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sortBy` (optional): `dateAdded` | `word` (default: dateAdded)
- `order` (optional): `asc` | `desc` (default: desc)

**Headers:** `Authorization: Bearer <access-token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "word": "ephemeral",
      "definition": "Lasting for a very short time",
      "partOfSpeech": "adjective",
      "exampleSentence": "The beauty of cherry blossoms is ephemeral.",
      "synonyms": ["fleeting", "transient", "temporary"],
      "dateAdded": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 3.2 Add Word to User's Dictionary
**POST** `/my-words`

**Headers:**
- `Authorization: Bearer <access-token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "word": "ephemeral",
  "definition": "Lasting for a very short time",
  "partOfSpeech": "adjective",
  "exampleSentence": "The beauty of cherry blossoms is ephemeral.",
  "synonyms": ["fleeting", "transient", "temporary"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "word": "ephemeral",
    "dateAdded": "2024-01-15T10:30:00Z"
  }
}
```

**Error (409):**
```json
{
  "success": false,
  "error": {
    "code": "WORD_EXISTS",
    "message": "This word is already in your dictionary"
  }
}
```

---

### 3.3 Remove Word from User's Dictionary
**DELETE** `/my-words/:id`

**Headers:** `Authorization: Bearer <access-token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Word removed successfully"
}
```

---

### 3.4 Search User's Saved Words
**GET** `/my-words/search`

**Query Parameters:**
- `q` (required): Search term
- `limit` (optional): Results limit (default: 10, max: 50)

**Headers:** `Authorization: Bearer <access-token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "word": "ephemeral",
      "definition": "Lasting for a very short time",
      "partOfSpeech": "adjective",
      "exampleSentence": "The beauty of cherry blossoms is ephemeral.",
      "synonyms": ["fleeting", "transient", "temporary"],
      "dateAdded": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 10
  }
}
```

---

## 4. API with LLM Model (Gemini)

### 4.1 Correct Text
**POST** `/llm/correct`

**Headers:**
- `Authorization: Bearer <access-token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "text": "I goes to the store yesterday and buyed some apples.",
  "style": "formal",
  "includeIelts": true
}
```

**Caching Strategy:**
This endpoint uses Redis caching to avoid redundant LLM calls for identical text. The cache key is generated from a hash of the input text and parameters.

```typescript
// Generate cache key from input
import crypto from 'crypto';

function generateLLMCacheKey(text: string, style: string, includeIelts: boolean): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${text}:${style}:${includeIelts}`)
    .digest('hex');
  return `llm:correct:${hash}`;
}

// Check cache before calling LLM
const cacheKey = generateLLMCacheKey(text, style, includeIelts);
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached); // Cache hit - save API costs!
}

// Call Gemini API
const result = await callGeminiCorrection(text, style, includeIelts);

// Cache for 24 hours
await redis.setex(cacheKey, 86400, JSON.stringify(result));
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "correctedText": "I went to the store yesterday and bought some apples.",
    "segments": [
      {
        "text": "I ",
        "isCorrection": false
      },
      {
        "text": "went",
        "isCorrection": true,
        "originalText": "goes",
        "explanation": "Changed to past tense to match 'yesterday'"
      },
      {
        "text": " to the store yesterday and ",
        "isCorrection": false
      },
      {
        "text": "bought",
        "isCorrection": true,
        "originalText": "buyed",
        "explanation": "Corrected irregular past tense"
      },
      {
        "text": " some apples.",
        "isCorrection": false
      }
    ],
    "explanation": "Corrected verb tenses to match past time reference.",
    "betterPhrasing": "Yesterday, I went to the store and purchased some apples.",
    "betterPhrasingExplanation": "Moved time reference to beginning, used more formal verb 'purchased'.",
    "enhancedVocabulary": [
      {
        "term": "purchased",
        "type": "word",
        "definition": "To buy or acquire something",
        "example": "I purchased a new laptop yesterday.",
        "pronunciation": "/ˈpɜːrtʃəst/"
      }
    ],
    "keyImprovements": [
      "Fixed verb tense consistency",
      "Corrected irregular verb form",
      "Improved sentence structure"
    ],
    "ieltsAssessment": {
      "overallBand": 6.5,
      "criteria": [
        {
          "name": "Grammatical Range and Accuracy",
          "score": 6,
          "feedback": "Basic grammar is accurate, but limited range of structures"
        },
        {
          "name": "Lexical Resource",
          "score": 7,
          "feedback": "Good vocabulary range with some less common items"
        }
      ],
      "generalFeedback": "Good foundation, focus on using more complex structures"
    }
  }
}
```

---

### 4.2 Define Word with AI
**POST** `/llm/define`

**Headers:**
- `Authorization: Bearer <access-token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "word": "ubiquitous",
  "context": "Smartphones have become ubiquitous in modern society."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "word": "ubiquitous",
    "definition": "Present, appearing, or found everywhere; widespread",
    "partOfSpeech": "adjective",
    "exampleSentence": "Coffee shops are ubiquitous in this city.",
    "synonyms": ["omnipresent", "pervasive", "universal", "widespread"],
    "contextualMeaning": "In your sentence, it means that smartphones can be found everywhere in modern society.",
    "pronunciation": "/juːˈbɪkwɪtəs/"
  }
}
```

---

### 4.3 Generate Writing Suggestions
**POST** `/llm/suggest`

**Headers:**
- `Authorization: Bearer <access-token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "text": "The company is experiencing significant growth in sales",
  "style": "formal",
  "type": "completion"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "text": "The company is experiencing significant growth in sales, driven by increased market demand and strategic expansion initiatives.",
        "type": "completion",
        "reason": "Provides specific reasons for the growth"
      },
      {
        "text": "The organization is witnessing substantial sales expansion",
        "type": "refinement",
        "reason": "More formal and sophisticated phrasing"
      }
    ]
  }
}
```

---

### 4.4 Analyze Writing Style
**POST** `/llm/analyze`

**Headers:**
- `Authorization: Bearer <access-token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "text": "Your essay text here...",
  "targetStyle": "academic"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "currentStyle": "casual",
    "targetStyle": "academic",
    "styleScore": 6.5,
    "recommendations": [
      "Use more formal vocabulary",
      "Avoid contractions",
      "Include more citations and evidence"
    ],
    "examples": [
      {
        "original": "Don't use this phrase",
        "improved": "It is advisable to avoid this phrase",
        "explanation": "Removed contraction and used formal structure"
      }
    ]
  }
}
```

---

## 5. App Settings API

### 5.1 Get User Settings
**GET** `/settings`

**Headers:** `Authorization: Bearer <access-token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fontFamily": "inter",
    "aiModel": "gemini-2.5-flash",
    "theme": "light",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 5.2 Update User Settings
**PATCH** `/settings`

**Headers:**
- `Authorization: Bearer <access-token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "fontFamily": "merriweather",
  "aiModel": "gemini-3-pro-preview",
  "theme": "dark"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fontFamily": "merriweather",
    "aiModel": "gemini-3-pro-preview",
    "theme": "dark",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

**Validation:**
- `fontFamily`: must be one of: `inter`, `merriweather`, `playfair`, `roboto-mono`
- `aiModel`: must be one of: `gemini-2.5-flash`, `gemini-3-pro-preview`
- `theme`: must be one of: `light`, `dark`

---

## Authentication & Authorization

### JWT Strategy

**Access Token:**
- Lifetime: 15 minutes
- Contains: userId, email, role
- Used for all authenticated requests

**Refresh Token:**
- Lifetime: 7 days
- Stored in database (Session table)
- Used to obtain new access token
- Invalidated on logout

**Token Payload:**
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  iat: number;  // issued at
  exp: number;  // expiration
}
```

### Authorization Levels

1. **Public Routes:** No authentication required
   - None in this API (all require auth)

2. **Authenticated Routes:** Valid access token required
   - All `/auth/me`, `/dictionary/*`, `/my-words/*`, `/llm/*`, `/settings/*`

3. **Admin Routes:** Admin role required
   - `POST /dictionary/words`
   - `DELETE /dictionary/words/:id`
   - `GET /admin/*` (future admin panel)

### Middleware Chain

```typescript
// Example route protection
router.post('/llm/correct',
  authenticate,           // Verify JWT
  validateRequest,        // Validate request body with Zod
  rateLimitLLM,          // Rate limiting for expensive operations
  handleCorrection       // Controller
);

router.post('/dictionary/words',
  authenticate,
  requireAdmin,          // Check user role
  validateRequest,
  handleAddWord
);
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "specific field that caused error",
      "reason": "detailed reason"
    }
  }
}
```

### Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Request validation failed |
| 401 | `INVALID_CREDENTIALS` | Invalid email or password |
| 401 | `TOKEN_EXPIRED` | Access token expired |
| 401 | `INVALID_TOKEN` | Malformed or invalid token |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `WORD_EXISTS` | Word already in dictionary |
| 409 | `EMAIL_EXISTS` | Email already registered |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `LLM_UNAVAILABLE` | AI service unavailable |

---

## Security Considerations

### 1. Password Security
- Hash with bcrypt (cost factor: 10)
- Minimum 8 characters
- Require: uppercase, lowercase, number
- Consider: special characters (optional)

### 2. Rate Limiting (Redis-backed)

**Using `express-rate-limit` with Redis store:**

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from './config/redis';

// General API rate limiting
const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'ratelimit:general:',
  }),
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  }
});

// Authentication endpoints (stricter)
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'ratelimit:auth:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,                     // 5 login attempts per 15 min
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again in 15 minutes'
    }
  }
});

// LLM endpoints (expensive operations)
const llmLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'ratelimit:llm:',
  }),
  windowMs: 60 * 1000,        // 1 minute
  max: 10,                    // 10 requests per minute
  skipSuccessfulRequests: false,
  message: {
    success: false,
    error: {
      code: 'LLM_RATE_LIMIT_EXCEEDED',
      message: 'Too many AI requests, please wait a moment'
    }
  }
});

// Apply limiters
app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/llm', llmLimiter);
```

**Custom Redis-based Rate Limiter (per-user):**

```typescript
// Advanced rate limiting per user
async function checkUserRateLimit(
  userId: string,
  endpoint: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const key = `ratelimit:user:${userId}:${endpoint}`;
  const current = await redis.incr(key);

  if (current === 1) {
    // First request, set expiration
    await redis.expire(key, windowSeconds);
  }

  return current <= maxRequests;
}

// Middleware
async function userRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = req.user?.id;
  const endpoint = req.route.path;

  const allowed = await checkUserRateLimit(userId, endpoint, 10, 60);

  if (!allowed) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests'
      }
    });
  }

  next();
}
```

### 3. Input Validation
- Use Zod schemas for all inputs
- Sanitize HTML/script tags
- Validate file uploads (if added)
- Limit request body size

### 4. CORS Configuration

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 5. SQL Injection Prevention
- Prisma automatically prevents SQL injection
- Never use raw queries without parameterization

### 6. Environment Variables
- Never commit `.env` files
- Use different keys for dev/prod
- Rotate secrets regularly

---

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/prosepolish?schema=public"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
REDIS_DB=0
REDIS_TLS_ENABLED=false

# JWT
JWT_ACCESS_SECRET="your-super-secret-access-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Server
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:8080"

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"

# Free Dictionary API
FREE_DICTIONARY_API_URL="https://api.dictionaryapi.dev/api/v2/entries/en"
DICTIONARY_CACHE_TTL_DAYS=30
DICTIONARY_REQUEST_DELAY_MS=100

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS="http://localhost:8080,http://localhost:3000"

# Logging
LOG_LEVEL="info"
```

---

## API Versioning

All endpoints are versioned with `/api` prefix:
- Current version: `/api/*`
- Future versions: `/api/v2/*`

This design ensures backward compatibility when introducing breaking changes.

---

## Dictionary Service Architecture

### Multi-Layer Caching Dictionary Lookup Flow

```
User Request for Word Definition
        ↓
[1] Check Redis Cache (L1 - In-Memory)
        ↓
    Found? ──Yes──→ Return Result (fastest: ~1ms)
        ↓ No
[2] Check PostgreSQL Cache (L2 - Persistent)
        ↓
    Found & Not Expired? ──Yes──→ Cache in Redis → Return Result (~10ms)
        ↓ No
[3] Query Free Dictionary API (L3 - External)
        ↓
    Success? ──Yes──→ Cache in Redis + PostgreSQL → Return Result (~200ms)
        ↓ No (404)
[4] Fallback to Gemini AI (L4 - LLM)
        ↓
    Success? ──Yes──→ Cache in Redis + PostgreSQL → Return Result (~1-2s)
        ↓ No
[5] Return "Word Not Found" Error
```

### Implementation with Redis

```typescript
async function getWordDefinition(word: string) {
  const normalizedWord = word.toLowerCase();
  const redisKey = `dict:${normalizedWord}`;

  // Layer 1: Check Redis cache (fastest)
  const redisCached = await redis.get(redisKey);
  if (redisCached) {
    return JSON.parse(redisCached);
  }

  // Layer 2: Check PostgreSQL cache
  const dbCached = await db.dictionaryEntry.findUnique({
    where: { word: normalizedWord }
  });

  if (dbCached && dbCached.cacheExpiresAt > new Date()) {
    // Cache in Redis for 1 hour
    await redis.setex(redisKey, 3600, JSON.stringify(dbCached));
    return dbCached;
  }

  // Layer 3: Try Free Dictionary API
  try {
    const response = await axios.get(
      `${FREE_DICTIONARY_API_URL}/${normalizedWord}`
    );
    const transformed = transformFreeDictionaryData(response.data);
    const expiresAt = addDays(new Date(), 30);

    // Cache in both Redis and PostgreSQL
    const entry = await db.dictionaryEntry.upsert({
      where: { word: normalizedWord },
      update: {
        ...transformed,
        source: 'freedictionary',
        cacheExpiresAt: expiresAt
      },
      create: {
        ...transformed,
        source: 'freedictionary',
        cacheExpiresAt: expiresAt
      }
    });

    // Cache in Redis for 1 hour
    await redis.setex(redisKey, 3600, JSON.stringify(entry));

    return entry;
  } catch (error) {
    if (error.response?.status === 404) {
      // Layer 4: Fallback to Gemini AI
      try {
        const geminiDef = await getDefinitionFromGemini(normalizedWord);
        const expiresAt = addDays(new Date(), 30);

        const entry = await db.dictionaryEntry.create({
          data: {
            ...geminiDef,
            source: 'gemini',
            cacheExpiresAt: expiresAt
          }
        });

        // Cache in Redis for 1 hour
        await redis.setex(redisKey, 3600, JSON.stringify(entry));

        return entry;
      } catch (geminiError) {
        // Layer 5: Word truly not found
        throw new WordNotFoundError(normalizedWord);
      }
    }
    throw error;
  }
}
```

**Performance Benchmarks:**
- Redis cache hit: ~1-5ms ⚡
- PostgreSQL cache hit: ~10-20ms 🚀
- Free Dictionary API: ~200-500ms 🌐
- Gemini AI fallback: ~1000-2000ms 🤖

### Cache Management

**Automatic Cleanup Job:**
```typescript
// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  await db.dictionaryEntry.deleteMany({
    where: {
      cacheExpiresAt: {
        lt: new Date()
      }
    }
  });
  console.log('Expired dictionary cache entries cleaned up');
});
```

**Manual Cache Refresh (Admin Endpoint):**
```http
POST /admin/dictionary/refresh/:word
Authorization: Bearer <admin-token>
```

---

## Rate Limits Summary

| Endpoint Category | Window | Max Requests | Notes |
|------------------|--------|--------------|-------|
| General API | 15 min | 100 | All authenticated routes |
| Auth endpoints | 15 min | 5 | Login/register |
| LLM endpoints | 1 min | 10 | Expensive AI operations |
| Dictionary search | 1 min | 30 | Search operations |

---

## Future Enhancements

1. **Websockets:** Real-time writing suggestions
2. **File Upload:** Import/export user documents
3. **Analytics Dashboard:** User writing statistics
4. **Batch Operations:** Process multiple texts
5. **Admin Panel:** User management, dictionary management
6. **Webhooks:** Integration with other services
7. **API Keys:** For third-party integrations
8. **Redis Cluster:** Distributed caching for horizontal scaling
9. **Dictionary Etymology:** Include word origin and history from Free Dictionary API
10. **Audio Pronunciation:** Stream audio files for pronunciation practice
11. **Redis Pub/Sub:** Real-time notifications across server instances
12. **Cache Warming:** Pre-populate cache with common words on startup

---

## Testing Strategy

1. **Unit Tests:** Service layer, utility functions
2. **Integration Tests:** API endpoints with test database
3. **E2E Tests:** Complete user flows
4. **Load Tests:** Performance under concurrent users
5. **Security Tests:** Penetration testing, vulnerability scanning

---

## Monitoring & Logging

1. **Request Logging:** Morgan middleware
2. **Error Tracking:** Sentry integration (production)
3. **Performance Monitoring:** Response times, database queries
4. **AI Usage Tracking:** Token consumption, costs
5. **Cache Metrics:** Redis hit/miss rates, memory usage
6. **Dictionary Cache Metrics:** Hit rate, miss rate, API fallback frequency
7. **Health Check Endpoint:** `GET /health`

```json
// GET /health
{
  "status": "healthy",
  "timestamp": "2024-01-15T12:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "gemini": "available",
    "freeDictionaryApi": "available"
  },
  "cache": {
    "redis": {
      "status": "connected",
      "usedMemory": "15.2 MB",
      "keys": 3421,
      "hitRate": "94.7%",
      "avgResponseTime": "2ms"
    },
    "postgresql": {
      "dictionaryEntries": 1247,
      "expiringSoon": 23
    }
  },
  "performance": {
    "avgDictionaryLookup": "5ms",
    "avgLLMRequest": "1200ms"
  }
}
```

**Redis-Specific Metrics to Track:**

```typescript
// Get Redis stats
async function getRedisStats() {
  const info = await redis.info('stats');
  const memory = await redis.info('memory');
  const dbSize = await redis.dbsize();

  return {
    totalConnections: parseRedisInfo(info, 'total_connections_received'),
    totalCommands: parseRedisInfo(info, 'total_commands_processed'),
    keyspaceHits: parseRedisInfo(info, 'keyspace_hits'),
    keyspaceMisses: parseRedisInfo(info, 'keyspace_misses'),
    usedMemory: parseRedisInfo(memory, 'used_memory_human'),
    keys: dbSize,
    hitRate: calculateHitRate()
  };
}
```

**Metrics Dashboard:**
- **Cache Performance:**
  - Redis hit/miss ratio per cache type (dict, user, session, llm)
  - Average cache lookup time
  - Memory usage and eviction rate

- **Dictionary Service:**
  - Cache hit/miss ratio across all layers
  - Free Dictionary API response times
  - Gemini AI fallback frequency
  - Most frequently looked up words
  - Failed lookups for review

- **LLM Caching:**
  - LLM cache hit rate (cost savings)
  - Average tokens saved per day
  - Most common correction patterns

- **Session Management:**
  - Active sessions count
  - Session creation/deletion rate
  - Average session lifetime

---

**Document Version:** 1.2
**Last Updated:** 2024-11-30
**Author:** ProsePolish Development Team

**Changelog:**
- v1.2: Added comprehensive Redis caching layer
  - Multi-layer caching architecture (Redis + PostgreSQL)
  - Redis-backed session management
  - Redis-backed rate limiting
  - LLM response caching
  - Enhanced monitoring and metrics
- v1.1: Added Free Dictionary API integration with caching strategy
- v1.0: Initial design document
