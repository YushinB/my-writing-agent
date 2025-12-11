# AI Gateway - Manual Testing Guide

**Date:** December 11, 2025
**Phase:** 1 - Foundation
**Purpose:** Manual testing procedures for AI Gateway endpoints

---

## Prerequisites

Before testing, ensure:

1. **Environment Setup**
   - OpenAI API key configured in `.env`: `OPENAI_API_KEY=your_key_here`
   - Database migrations applied: `npm run db:migrate`
   - Backend server running: `npm run dev`
   - Valid user account created for authentication

2. **Required Tools**
   - Thunder Client, Postman, or similar API testing tool
   - Access to database for verification (Prisma Studio: `npm run db:studio`)

---

## Test Setup

### 1. Create Test User (if not exists)

```bash
# Register a new user
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "email": "test-ai@example.com",
  "password": "Test123!@#",
  "name": "AI Test User"
}
```

Save the `accessToken` from the response for subsequent requests.

### 2. Check Initial Quota

```bash
# Verify quota was created
# Use Prisma Studio or database query:
SELECT * FROM "AIQuota" WHERE "userId" = '<user-id>';
```

Expected defaults:
- `dailyRequestLimit`: 1000
- `monthlyRequestLimit`: 10000
- `monthlySpendLimit`: 10.0
- `tier`: 'free'

---

## Core Functionality Tests

### Test 1: Basic Text Generation

**Objective:** Verify basic AI generation works

```bash
POST http://localhost:3000/api/v1/ai/generate
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "prompt": "Write a haiku about coding",
  "options": {
    "maxTokens": 100,
    "temperature": 0.7
  }
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "output": "<generated haiku>",
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "cached": false,
    "usage": {
      "promptTokens": 10,
      "completionTokens": 20,
      "totalTokens": 30
    },
    "latency": 1234,
    "costEstimate": {
      "amount": 0.001,
      "currency": "USD",
      "breakdown": {
        "promptCost": 0.0005,
        "completionCost": 0.0005
      }
    }
  },
  "timestamp": "2025-12-11T..."
}
```

**Verify:**
- ✅ Response contains generated text
- ✅ Token usage is included
- ✅ Cost estimate is present
- ✅ Latency is a positive number
- ✅ Database: Check `AIUsage` table for new record
- ✅ Database: Check `AIQuota` counters incremented

---

### Test 2: Generation with System Prompt

**Objective:** Test system prompt functionality

```bash
POST http://localhost:3000/api/v1/ai/generate
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "prompt": "Explain recursion",
  "options": {
    "systemPrompt": "You are a computer science professor. Explain concepts clearly with examples.",
    "maxTokens": 200,
    "temperature": 0.5
  }
}
```

**Expected Response (200):**
- Should receive a response with professor-like explanation
- System prompt influence should be visible in the tone

---

### Test 3: Health Check

**Objective:** Verify provider health endpoint

```bash
GET http://localhost:3000/api/v1/ai/health
Authorization: Bearer <your_access_token>
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "providers": {
      "openai": {
        "healthy": true,
        "lastChecked": "2025-12-11T...",
        "latency": 123
      }
    }
  },
  "timestamp": "2025-12-11T..."
}
```

**Verify:**
- ✅ Provider shows as healthy
- ✅ Timestamp is recent
- ✅ Latency is present

---

## Validation Tests

### Test 4: Missing Required Field

**Objective:** Verify validation rejects missing prompt

```bash
POST http://localhost:3000/api/v1/ai/generate
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "options": {
    "maxTokens": 100
  }
}
```

**Expected Response (400):**
```json
{
  "success": false,
  "error": {
    "message": "Validation error...",
    "details": "..."
  }
}
```

---

### Test 5: Empty Prompt

**Objective:** Verify validation rejects empty prompt

```bash
POST http://localhost:3000/api/v1/ai/generate
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "prompt": ""
}
```

**Expected Response (400):**
- Should reject with validation error

---

### Test 6: Invalid MaxTokens

**Objective:** Verify validation enforces token limits

```bash
POST http://localhost:3000/api/v1/ai/generate
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "prompt": "Test",
  "options": {
    "maxTokens": 100000
  }
}
```

**Expected Response (400):**
- Should reject with validation error about maxTokens exceeding limit

---

### Test 7: Invalid Temperature

**Objective:** Verify validation enforces temperature range

```bash
POST http://localhost:3000/api/v1/ai/generate
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "prompt": "Test",
  "options": {
    "temperature": 3.0
  }
}
```

**Expected Response (400):**
- Should reject with validation error about temperature range (0-2)

---

## Authentication Tests

### Test 8: No Authentication

**Objective:** Verify endpoints require authentication

```bash
POST http://localhost:3000/api/v1/ai/generate
Content-Type: application/json

{
  "prompt": "Test"
}
```

**Expected Response (401):**
```json
{
  "success": false,
  "error": {
    "message": "Unauthorized"
  }
}
```

---

### Test 9: Invalid Token

**Objective:** Verify invalid tokens are rejected

```bash
POST http://localhost:3000/api/v1/ai/generate
Authorization: Bearer invalid_token_12345
Content-Type: application/json

{
  "prompt": "Test"
}
```

**Expected Response (401):**
- Should reject with authentication error

---

## Quota Tests

### Test 10: Exceed Daily Quota

**Objective:** Verify daily quota enforcement

**Setup:**
```sql
-- Set user's daily quota to limit
UPDATE "AIQuota"
SET "dailyRequestCount" = "dailyRequestLimit"
WHERE "userId" = '<user-id>';
```

**Request:**
```bash
POST http://localhost:3000/api/v1/ai/generate
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "prompt": "Test quota exceeded"
}
```

**Expected Response (429):**
```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Daily request limit exceeded (1000 requests). Resets at ..."
  }
}
```

**Cleanup:**
```sql
-- Reset quota
UPDATE "AIQuota"
SET "dailyRequestCount" = 0
WHERE "userId" = '<user-id>';
```

---

### Test 11: Exceed Monthly Request Quota

**Objective:** Verify monthly request quota enforcement

**Setup:**
```sql
UPDATE "AIQuota"
SET "monthlyRequestCount" = "monthlyRequestLimit"
WHERE "userId" = '<user-id>';
```

**Request:** Same as Test 10

**Expected Response (429):**
- Message should indicate monthly request limit exceeded

**Cleanup:**
```sql
UPDATE "AIQuota"
SET "monthlyRequestCount" = 0
WHERE "userId" = '<user-id>';
```

---

### Test 12: Exceed Monthly Spend Quota

**Objective:** Verify monthly spend quota enforcement

**Setup:**
```sql
UPDATE "AIQuota"
SET "monthlySpendAmount" = "monthlySpendLimit"
WHERE "userId" = '<user-id>';
```

**Request:** Same as Test 10

**Expected Response (429):**
- Message should indicate monthly spend limit exceeded

**Cleanup:**
```sql
UPDATE "AIQuota"
SET "monthlySpendAmount" = 0
WHERE "userId" = '<user-id>';
```

---

## Usage Tracking Tests

### Test 13: Verify Usage Recording

**Objective:** Confirm usage is tracked correctly

**Steps:**
1. Note current `AIUsage` count for user
2. Make a successful generation request
3. Wait 1-2 seconds for async tracking
4. Query database

```sql
SELECT * FROM "AIUsage"
WHERE "userId" = '<user-id>'
ORDER BY "createdAt" DESC
LIMIT 1;
```

**Verify:**
- ✅ New record created
- ✅ `successful` = true
- ✅ `promptTokens` > 0
- ✅ `completionTokens` > 0
- ✅ `totalTokens` = promptTokens + completionTokens
- ✅ `estimatedCost` > 0
- ✅ `latency` > 0
- ✅ `model` = 'gpt-3.5-turbo' or similar
- ✅ `providerId` exists

---

### Test 14: Verify Quota Increment

**Objective:** Confirm quotas are incremented after requests

**Steps:**
1. Query user's current quota counts
```sql
SELECT "dailyRequestCount", "monthlyRequestCount", "monthlySpendAmount"
FROM "AIQuota"
WHERE "userId" = '<user-id>';
```

2. Make a successful generation request
3. Wait 1-2 seconds
4. Query quota again

**Verify:**
- ✅ `dailyRequestCount` increased by 1
- ✅ `monthlyRequestCount` increased by 1
- ✅ `monthlySpendAmount` increased by request cost

---

## Error Handling Tests

### Test 15: Provider Error Handling

**Objective:** Verify graceful error handling when provider fails

**Setup:** Use invalid API key in `.env`
```
OPENAI_API_KEY=invalid_key_123
```

**Request:** Any generation request

**Expected Response (502 or similar):**
- Should return structured error response
- Should not expose sensitive details
- Should indicate provider error

**Cleanup:** Restore valid API key

---

### Test 16: Timeout Handling

**Objective:** Verify timeout handling

**Setup:** Set very short timeout
```
AI_GATEWAY_REQUEST_TIMEOUT=1
```

**Request:** Any generation request

**Expected:**
- Should timeout quickly
- Should return timeout error

**Cleanup:** Restore normal timeout

---

## Performance Tests

### Test 17: Multiple Concurrent Requests

**Objective:** Verify system handles concurrent requests

**Steps:**
1. Make 5 simultaneous generation requests
2. Verify all complete successfully
3. Check response times

**Expected:**
- All requests should succeed (if quota allows)
- Response times should be reasonable
- No race conditions in quota/usage tracking

---

### Test 18: Response Time

**Objective:** Verify acceptable response times

**Test:** Make 10 generation requests and measure latency

**Expected:**
- Average latency < 3000ms
- No requests > 10000ms (excluding actual AI processing time)
- Latency field in response matches actual time

---

## Data Integrity Tests

### Test 19: Cost Calculation Accuracy

**Objective:** Verify cost calculations are correct

**Steps:**
1. Make request with known token counts
2. Verify cost calculation:
   - GPT-3.5-turbo: ~$0.0015/1K prompt tokens, ~$0.002/1K completion tokens
3. Compare calculated cost with `costEstimate.amount`

**Manual Calculation:**
```
promptCost = (promptTokens / 1000) * 0.0015
completionCost = (completionTokens / 1000) * 0.002
totalCost = promptCost + completionCost
```

**Verify:** Calculated cost matches response within reasonable tolerance

---

### Test 20: Quota Reset Behavior

**Objective:** Verify quota resets work correctly

**Steps:**
1. Set `dailyResetAt` to past date
```sql
UPDATE "AIQuota"
SET "dailyResetAt" = NOW() - INTERVAL '1 day',
    "dailyRequestCount" = 500
WHERE "userId" = '<user-id>';
```

2. Make a generation request
3. Check quota after request

**Verify:**
- ✅ `dailyRequestCount` reset to 1 (not 501)
- ✅ `dailyResetAt` updated to next day

---

## Test Summary Checklist

Use this checklist to track testing progress:

### Core Functionality
- [ ] Test 1: Basic text generation
- [ ] Test 2: Generation with system prompt
- [ ] Test 3: Health check

### Validation
- [ ] Test 4: Missing required field
- [ ] Test 5: Empty prompt
- [ ] Test 6: Invalid maxTokens
- [ ] Test 7: Invalid temperature

### Authentication
- [ ] Test 8: No authentication
- [ ] Test 9: Invalid token

### Quota Management
- [ ] Test 10: Exceed daily quota
- [ ] Test 11: Exceed monthly request quota
- [ ] Test 12: Exceed monthly spend quota

### Usage Tracking
- [ ] Test 13: Verify usage recording
- [ ] Test 14: Verify quota increment

### Error Handling
- [ ] Test 15: Provider error handling
- [ ] Test 16: Timeout handling

### Performance
- [ ] Test 17: Multiple concurrent requests
- [ ] Test 18: Response time

### Data Integrity
- [ ] Test 19: Cost calculation accuracy
- [ ] Test 20: Quota reset behavior

---

## Common Issues & Troubleshooting

### Issue: "OPENAI_API_KEY not found"
**Solution:** Add `OPENAI_API_KEY=your_key` to `.env` file and restart server

### Issue: Quota not incrementing
**Solution:**
- Check async operation completed (wait 1-2 seconds)
- Verify database connection
- Check logs for errors

### Issue: Tests fail with authentication errors
**Solution:**
- Ensure access token is fresh (tokens expire)
- Re-login to get new token
- Check token format: "Bearer <token>"

### Issue: Health check shows unhealthy
**Solution:**
- Verify API key is valid
- Check internet connection
- Test OpenAI API directly: `curl https://api.openai.com/v1/models`

---

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Delete test usage records
DELETE FROM "AIUsage" WHERE "userId" = '<test-user-id>';

-- Reset test quota
UPDATE "AIQuota"
SET "dailyRequestCount" = 0,
    "monthlyRequestCount" = 0,
    "monthlySpendAmount" = 0
WHERE "userId" = '<test-user-id>';

-- Optional: Delete test user
DELETE FROM "User" WHERE email = 'test-ai@example.com';
```

---

## Automated Test Execution

To run automated tests:

```bash
# Run all AI Gateway tests
npm run test:coverage -- --testPathPatterns="AIGateway|aiGateway"

# Run specific test file
npm test -- OpenAIAdapter.test.ts

# Run integration tests
npm test -- tests/integration/aiGateway.test.ts
```

---

**Notes:**
- Always test in development environment first
- Monitor database for data integrity
- Check application logs for errors
- Verify all tests pass before deployment
- Document any issues found during testing
