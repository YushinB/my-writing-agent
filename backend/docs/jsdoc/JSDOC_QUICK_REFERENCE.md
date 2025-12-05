# JSDoc Quick Reference Guide
## Documented ProsePolish Backend Functions

---

## LLM Service (`src/services/llm.service.ts`)

### Public Methods

**1. correctText(userId, request)**
```typescript
// Corrects text for grammar, spelling, punctuation
// Returns: { originalText, correctedText, changes, suggestions, cached }
// Example: llmService.correctText('user123', { text: 'She dont knows', context: 'Check grammar' })
```

**2. defineWord(userId, request)**
```typescript
// Provides comprehensive word definition with examples
// Returns: { word, definition, examples[], synonyms[], antonyms[], partOfSpeech, cached }
// Example: llmService.defineWord('user123', { word: 'eloquent', context: 'speaking skill' })
```

**3. generateSuggestions(userId, request)**
```typescript
// Generates alternative text versions
// Types: 'paraphrase' | 'expand' | 'summarize' | 'improve'
// Returns: { originalText, suggestions[], type, cached }
// Example: llmService.generateSuggestions('user123', { text: 'Hello', type: 'paraphrase', count: 3 })
```

**4. analyzeWritingStyle(userId, request)**
```typescript
// Analyzes text style with readability score and tone
// Returns: { text, analysis: { tone, readabilityScore, wordCount, sentenceCount, averageWordsPerSentence, complexWords, suggestions[] }, cached }
// Example: llmService.analyzeWritingStyle('user123', { text: 'Sample text here' })
```

### Private Methods (Documented for Maintenance)

- **generateHash()** - Creates SHA-256 hash for cache keys
- **withRetry()** - Executes operations with exponential backoff retry (max 3 retries)
- **createCorrectionPrompt()** - Constructs structured prompt for AI
- **parseCorrectionResponse()** - Parses AI response into response format
- **logUsage()** - Logs API usage for quota tracking

---

## Dictionary Service (`src/services/dictionary.service.ts`)

### Public Methods

**1. searchWord(word)**
```typescript
// Searches word through 4-layer cache system
// Layers: Redis → PostgreSQL → Free Dictionary API → Gemini AI
// Returns: DictionaryEntry | null
// Example: dictionaryService.searchWord('serendipity')
```

**2. addWord(entry) [Admin]**
```typescript
// Manually adds word to dictionary
// Parameters: { word, meanings, phonetic?, origin? }
// Returns: Promise<void>
// Example: dictionaryService.addWord({ word: 'eloquent', meanings: [...] })
```

**3. refreshCacheEntry(word) [Admin]**
```typescript
// Clears cache and fetches fresh definition
// Returns: DictionaryEntry (freshly loaded)
// Throws: NotFoundError if word not found
// Example: dictionaryService.refreshCacheEntry('eloquent')
```

**4. getPopularWords(limit)**
```typescript
// Gets most frequently accessed words
// Default limit: 10
// Returns: string[] (sorted by access count)
// Example: dictionaryService.getPopularWords(5)
```

### Private Methods (Documented for Maintenance)

- **getFromRedisCache()** - Layer 1: Fast memory cache
- **getFromDatabase()** - Layer 2: Persistent storage
- **cacheEntry()** - Store to both Redis and PostgreSQL
- **cacheToRedis()** - Store to Redis with TTL
- **updateAccessCount()** - Track word access statistics
- **fetchFromGemini()** - Layer 4: AI fallback definition

---

## JWT Utilities (`src/utils/jwt.ts`)

### Token Generation

**1. generateTokens(userId, role)**
```typescript
// Generates access + refresh token pair
// Parameters: userId (string), role (ADMIN|USER|...)
// Returns: { accessToken, refreshToken }
// Example: generateTokens('user123', 'USER')
```

**2. generateAccessToken(payload)**
```typescript
// Short-lived access token (~15 minutes)
// Used for API authentication
// Returns: JWT string
// Example: generateAccessToken({ userId: 'user123', email: '...', role: 'USER' })
```

**3. generateRefreshToken(payload)**
```typescript
// Long-lived refresh token (~7-30 days)
// Used to obtain new access tokens
// Returns: JWT string
// Example: generateRefreshToken({ userId: 'user123', email: '...', role: 'USER' })
```

### Token Verification

**4. verifyAccessToken(token)**
```typescript
// Validates access token
// Throws: TokenExpiredError | TokenInvalidError
// Returns: TokenPayload { userId, email, role }
// Example: const payload = verifyAccessToken(accessToken)
```

**5. verifyRefreshToken(token)**
```typescript
// Validates refresh token
// Throws: TokenExpiredError | TokenInvalidError
// Returns: TokenPayload { userId, email, role }
// Example: const payload = verifyRefreshToken(refreshToken)
```

### Token Inspection

**6. decodeToken(token)**
```typescript
// Decodes without verification (debugging only)
// Returns: TokenPayload | null
// Example: const payload = decodeToken(token)
```

**7. getTokenExpiration(token)**
```typescript
// Gets expiration time as Unix timestamp
// Returns: number | null (seconds since epoch)
// Example: const expiresAt = getTokenExpiration(token)
```

**8. isTokenExpired(token)**
```typescript
// Checks if token is expired
// Returns: boolean
// Example: if (isTokenExpired(accessToken)) { /* get new token */ }
```

---

## Password Hashing (`src/utils/hash.ts`)

### Hashing Operations

**1. hashPassword(password)**
```typescript
// Hash plain text password with bcrypt
// Parameters: password (string, 8-128 chars)
// Returns: Promise<string> (bcrypt hash)
// Example: const hash = await hashPassword('MyPassword123!')
```

**2. comparePassword(password, hash)**
```typescript
// Verify password against stored hash
// Time-constant comparison (prevents timing attacks)
// Returns: Promise<boolean>
// Example: const isValid = await comparePassword(inputPassword, storedHash)
```

**3. isValidHash(hash)**
```typescript
// Validates bcrypt hash format
// Pattern: $2[aby]$rounds$salt+hash
// Returns: boolean
// Example: if (isValidHash(storedHash)) { /* use hash */ }
```

---

## Common Patterns

### Error Handling

```typescript
// LLM Service
try {
  const response = await llmService.correctText(userId, request);
} catch (error) {
  if (error instanceof AIServiceError) {
    // Handle AI service errors
  }
}

// JWT Service
try {
  const payload = verifyAccessToken(token);
} catch (error) {
  if (error instanceof TokenExpiredError) {
    // Refresh access token
  } else if (error instanceof TokenInvalidError) {
    // Require re-login
  }
}

// Dictionary Service
const entry = await dictionaryService.searchWord('word');
if (!entry) {
  // Word not found in any layer
}
```

### Caching Strategy

```typescript
// LLM: Automatic Redis caching with TTL
// Dictionary: 4-layer intelligent fallback
// All responses include 'cached' boolean flag
```

### Authentication Flow

```typescript
// 1. Login: Generate tokens
const tokens = generateTokens(userId, role);
// Returns: { accessToken, refreshToken }

// 2. API Request: Verify access token
const payload = verifyAccessToken(accessToken);
// Returns: { userId, email, role }

// 3. Token Refresh: Use refresh token
const newAccessToken = generateAccessToken(payload);

// 4. Token Expiration Check
if (isTokenExpired(accessToken)) {
  // Request new access token
}
```

### Password Security Flow

```typescript
// Registration: Hash password
const hash = await hashPassword(inputPassword);
// Store hash in database

// Login: Verify password
const isValid = await comparePassword(inputPassword, storedHash);
if (isValid) {
  // Generate tokens and authenticate
}

// Validation: Check hash format
if (!isValidHash(retrievedHash)) {
  // Handle corrupted data
}
```

---

## Performance Notes

- **LLM Service**: Uses exponential backoff (1s, 2s, 4s) for 3 retry attempts
- **Dictionary Service**: 4-layer cache minimizes external API calls
- **JWT**: Fast cryptographic operations, suitable for per-request validation
- **Hash**: Bcrypt with 10 rounds balances security and speed (~100ms per operation)

---

## Configuration Dependencies

- **LLM Service**: `env.CACHE_TTL_LLM`, `env.GEMINI_MODEL`
- **Dictionary Service**: `env.CACHE_TTL_DICTIONARY`
- **JWT**: `env.JWT_ACCESS_SECRET`, `env.JWT_REFRESH_SECRET`, `env.JWT_ACCESS_EXPIRY`, `env.JWT_REFRESH_EXPIRY`
- **Hash**: Constant `SALT_ROUNDS = 10`

---

## Type Definitions

```typescript
// LLM Service
interface CorrectTextRequest { text: string; context?: string }
interface DefineWordRequest { word: string; context?: string }
interface GenerateSuggestionsRequest { text: string; type: 'paraphrase'|'expand'|'summarize'|'improve'; count?: number }
interface AnalyzeWritingStyleRequest { text: string }

// Dictionary Service
interface DictionaryEntry {
  word: string;
  phonetic?: string;
  meanings: any[];
  origin?: string;
}

// JWT Service
interface TokenPayload { userId: string; email: string; role: UserRole }
interface TokenPair { accessToken: string; refreshToken: string }
type UserRole = 'ADMIN' | 'USER' | ...
```

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| TokenExpiredError | Call `generateAccessToken()` with refresh token payload |
| TokenInvalidError | Token signature invalid - require re-login |
| AI Service Error | Automatic retry with exponential backoff (max 3 times) |
| Word not found | Checked all 4 cache layers, word doesn't exist |
| Password mismatch | Use `comparePassword()` instead of direct comparison |
| Invalid hash format | Use `isValidHash()` to validate before use |

---

Generated from JSDoc comments in ProsePolish backend source files.
Last Updated: December 5, 2025
