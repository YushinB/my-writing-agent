# ProsePolish API Documentation

## Overview

ProsePolish is an AI-powered writing assistant backend that provides comprehensive APIs for text correction, word definitions, writing analysis, and personal word management. Built with Express.js, the API offers secure authentication, intelligent LLM integration, and efficient caching.

**API Version:** v1
**Last Updated:** 2025-12-05

---

## Table of Contents

1. [Base URL & Authentication](#base-url--authentication)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Dictionary Endpoints](#dictionary-endpoints)
4. [My Words Endpoints](#my-words-endpoints)
5. [LLM Endpoints](#llm-endpoints)
6. [Settings Endpoints](#settings-endpoints)
7. [Health Endpoints](#health-endpoints)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

---

## Base URL & Authentication

### Base URL

```
http://localhost:3000/api/v1
```

Or with environment variables:
```
{BASE_URL}/api/v1
```

### Authentication Method

The API uses **Bearer Token Authentication** with JWT (JSON Web Tokens).

#### How to Authenticate

1. **Register or Login** to receive `accessToken` and `refreshToken`
2. **Include the token** in the Authorization header for all protected endpoints:

```bash
Authorization: Bearer {accessToken}
```

#### Token Information

- **Access Token**: Short-lived token (default: 15 minutes) for API requests
- **Refresh Token**: Long-lived token (default: 7 days) for obtaining new access tokens
- **Token Type**: JWT (JSON Web Token)

#### Header Example

```http
GET /api/v1/settings HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

#### Protected Endpoints

Endpoints marked with **🔒** require a valid access token.

#### Admin-Only Endpoints

Endpoints marked with **👑** require admin privileges in addition to authentication.

---

## Authentication Endpoints

### 1. Register User

Creates a new user account.

```http
POST /api/v1/auth/register
```

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | Minimum 8 characters, at least 1 letter and 1 number |
| name | string | No | User's full name |

**Response:**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2025-12-05T10:30:00Z",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 201 | User registered successfully |
| 400 | Validation error (invalid email, weak password, etc.) |
| 409 | Email already registered |
| 429 | Too many registration attempts |

**Validation Rules:**

- Email must be a valid email format
- Password must be at least 8 characters
- Password must contain at least 1 letter
- Password must contain at least 1 number
- Name (optional) must contain only letters, spaces, hyphens, and apostrophes

---

### 2. Login

Authenticates a user and returns access and refresh tokens.

```http
POST /api/v1/auth/login
```

**Rate Limit:** 5 requests per 15 minutes per IP (only failed attempts count)

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2025-12-05T10:30:00Z",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Login successful |
| 400 | Missing email or password |
| 401 | Invalid email or password |
| 429 | Too many login attempts |

---

### 3. Refresh Token

🔒 Obtains a new access token using a refresh token.

```http
POST /api/v1/auth/refresh
```

**Rate Limit:** General (100 requests per 15 minutes)

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| refreshToken | string | Yes | Valid refresh token from login/register |

**Response:**

```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Token refreshed successfully |
| 400 | Invalid or missing refresh token |
| 401 | Refresh token expired |

---

### 4. Logout

🔒 Invalidates the current user session.

```http
POST /api/v1/auth/logout
```

**Rate Limit:** General (100 requests per 15 minutes)

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{}
```

**Response:**

```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Logout successful |
| 401 | Unauthorized (missing or invalid token) |

---

### 5. Logout From All Devices

🔒 Invalidates all active sessions for the user across all devices.

```http
POST /api/v1/auth/logout-all
```

**Rate Limit:** General (100 requests per 15 minutes)

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{}
```

**Response:**

```json
{
  "success": true,
  "message": "Logged out from all devices",
  "data": null
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Successfully logged out from all devices |
| 401 | Unauthorized (missing or invalid token) |

---

### 6. Get Current User

🔒 Retrieves the authenticated user's profile information.

```http
GET /api/v1/auth/me
```

**Rate Limit:** General (100 requests per 15 minutes)

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-12-05T10:30:00Z",
    "role": "user",
    "lastLogin": "2025-12-05T14:20:15Z"
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | User information retrieved successfully |
| 401 | Unauthorized (missing or invalid token) |

---

### 7. Get User Sessions

🔒 Lists all active sessions for the authenticated user.

```http
GET /api/v1/auth/sessions
```

**Rate Limit:** General (100 requests per 15 minutes)

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "count": 2,
    "sessions": [
      {
        "id": "session-1",
        "deviceInfo": "Chrome on Windows",
        "lastActive": "2025-12-05T14:20:15Z",
        "createdAt": "2025-12-04T08:00:00Z"
      },
      {
        "id": "session-2",
        "deviceInfo": "Safari on iPhone",
        "lastActive": "2025-12-05T10:15:00Z",
        "createdAt": "2025-12-03T12:30:00Z"
      }
    ]
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Sessions retrieved successfully |
| 401 | Unauthorized (missing or invalid token) |

---

## Dictionary Endpoints

All dictionary endpoints require authentication (🔒).

### 1. Search Word

🔒 Searches for a word in the dictionary.

```http
GET /api/v1/dictionary/search?query=example
```

**Rate Limit:** General (100 requests per 15 minutes)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Word to search (max 50 characters) |
| limit | number | No | Maximum results to return (1-20, default: 10) |

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "word": "example",
    "pronunciation": "ɪɡ'zæmpəl",
    "partOfSpeech": "noun",
    "definitions": [
      {
        "definition": "A thing characteristic of its kind or illustrating a general rule",
        "example": "The British Library has a copy of almost every book published in the United Kingdom"
      }
    ],
    "synonyms": ["instance", "illustration", "sample"],
    "antonyms": ["exception"],
    "frequency": "common"
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Word found |
| 401 | Unauthorized |
| 404 | Word not found |

---

### 2. Get Word Definition

🔒 Retrieves the definition of a specific word.

```http
GET /api/v1/dictionary/word/:word
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| word | string | Word to look up |

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "word": "serendipity",
    "pronunciation": "ˌserənˈdɪpɪtē",
    "partOfSpeech": "noun",
    "definitions": [
      {
        "definition": "The occurrence and development of events by chance in a happy or beneficial way",
        "example": "A fortunate stroke of serendipity brought the two old friends together after decades"
      }
    ],
    "etymology": "Coined by Horace Walpole in 1754, based on the Persian fairy tale 'The Three Princes of Serendip'",
    "synonyms": ["luck", "chance", "fortune"],
    "frequency": "uncommon"
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Word definition retrieved |
| 401 | Unauthorized |
| 404 | Word not found |

---

### 3. Get Full Word Data

🔒 Retrieves comprehensive word data including metadata.

```http
GET /api/v1/dictionary/word/:word/full
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| word | string | Word to look up |

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "word": "serendipity",
    "pronunciation": "ˌserənˈdɪpɪtē",
    "partOfSpeech": "noun",
    "definitions": [
      {
        "definition": "The occurrence and development of events by chance in a happy or beneficial way"
      }
    ],
    "synonyms": ["luck", "chance", "fortune"],
    "antonyms": [],
    "etymology": "Coined by Horace Walpole in 1754",
    "frequency": "uncommon",
    "relatedWords": ["serendipitous", "serendipitously"],
    "metadata": {
      "queriedAt": "2025-12-05T14:25:30Z",
      "word": "serendipity"
    }
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Full word data retrieved |
| 401 | Unauthorized |
| 404 | Word not found |

---

### 4. Get Popular Words

🔒 Retrieves a list of commonly searched/used words.

```http
GET /api/v1/dictionary/popular?limit=10
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of popular words to return (default: 10, max: 20) |

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "words": [
      {
        "word": "serendipity",
        "definition": "The occurrence of events by chance in a beneficial way",
        "frequency": 1250
      },
      {
        "word": "eloquent",
        "definition": "Fluent or persuasive in speaking or writing",
        "frequency": 980
      },
      {
        "word": "pragmatic",
        "definition": "Dealing with things in a realistic and practical way",
        "frequency": 875
      }
    ]
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Popular words retrieved |
| 401 | Unauthorized |

---

### 5. Add Word to Dictionary

👑 🔒 Adds a new word to the dictionary (admin only).

```http
POST /api/v1/dictionary/words
```

**Rate Limit:** General (100 requests per 15 minutes)

**Headers:**

```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**

```json
{
  "word": "neologism",
  "pronunciation": "ni-ˈä-luh-ˌjiz-um",
  "partOfSpeech": "noun",
  "definitions": [
    {
      "definition": "A newly created or newly popular word or expression",
      "example": "The word 'selfie' is a modern neologism"
    }
  ],
  "synonyms": ["new word", "coinage"],
  "etymology": "From Greek neo- (new) + logos (word)"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| word | string | Yes | Word to add (letters, hyphens, apostrophes only, max 50 chars) |
| pronunciation | string | No | Phonetic pronunciation |
| partOfSpeech | string | No | Part of speech (noun, verb, adjective, etc.) |
| definitions | array | No | Array of definition objects |
| synonyms | array | No | Array of synonym words |
| etymology | string | No | Word origin and history |

**Response:**

```json
{
  "success": true,
  "message": "Word added to dictionary",
  "data": null
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 201 | Word added successfully |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden (admin only) |
| 409 | Word already exists |

---

### 6. Refresh Cache Entry

👑 🔒 Refreshes the cached data for a specific word (admin only).

```http
POST /api/v1/dictionary/word/:word/refresh
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| word | string | Word to refresh cache for |

**Response:**

```json
{
  "success": true,
  "message": "Cache refreshed",
  "data": {
    "word": "example",
    "cacheRefreshedAt": "2025-12-05T14:30:00Z",
    "cacheExpiresAt": "2025-12-12T14:30:00Z"
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Cache refreshed successfully |
| 401 | Unauthorized |
| 403 | Forbidden (admin only) |
| 404 | Word not found |

---

## My Words Endpoints

All My Words endpoints require authentication (🔒).

### 1. Get User's Saved Words

🔒 Retrieves paginated list of words saved by the user.

```http
GET /api/v1/my-words?page=1&limit=10
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1, min: 1) |
| limit | number | No | Items per page (default: 10, max: 100) |

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "word-1",
      "word": "perspicacious",
      "definition": "Having keen insight and discernment",
      "notes": "Great vocabulary word for essays",
      "addedAt": "2025-12-01T10:30:00Z",
      "lastReviewedAt": "2025-12-04T15:45:00Z"
    },
    {
      "id": "word-2",
      "word": "ephemeral",
      "definition": "Lasting for a very short time",
      "notes": "Use in poetry",
      "addedAt": "2025-11-28T08:15:00Z",
      "lastReviewedAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Words retrieved successfully |
| 401 | Unauthorized |

---

### 2. Add Word to My Words

🔒 Saves a new word to the user's personal word collection.

```http
POST /api/v1/my-words
```

**Headers:**

```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**

```json
{
  "word": "perspicacious",
  "notes": "Great vocabulary word for essays"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| word | string | Yes | Word to save (letters, hyphens, apostrophes only) |
| notes | string | No | Personal notes about the word (max 500 characters) |

**Response:**

```json
{
  "success": true,
  "message": "Word added",
  "data": {
    "id": "word-1",
    "word": "perspicacious",
    "definition": "Having keen insight and discernment",
    "notes": "Great vocabulary word for essays",
    "addedAt": "2025-12-05T14:35:00Z"
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 201 | Word saved successfully |
| 400 | Validation error |
| 401 | Unauthorized |
| 409 | Word already in collection |

---

### 3. Remove Word from My Words

🔒 Deletes a word from the user's personal word collection.

```http
DELETE /api/v1/my-words/:id
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | ID of the saved word to delete |

**Response:**

```json
{
  "success": true,
  "message": "Word removed",
  "data": null
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Word removed successfully |
| 401 | Unauthorized |
| 404 | Word not found in collection |

---

### 4. Update Word Notes

🔒 Updates the personal notes for a saved word.

```http
PATCH /api/v1/my-words/:id
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | ID of the saved word to update |

**Request Body:**

```json
{
  "notes": "Updated notes - use in professional writing"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| notes | string | Yes | Updated notes (max 500 characters) |

**Response:**

```json
{
  "success": true,
  "message": "Notes updated",
  "data": {
    "id": "word-1",
    "word": "perspicacious",
    "definition": "Having keen insight and discernment",
    "notes": "Updated notes - use in professional writing",
    "updatedAt": "2025-12-05T14:40:00Z"
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Notes updated successfully |
| 400 | Validation error |
| 401 | Unauthorized |
| 404 | Word not found in collection |

---

### 5. Search User's Words

🔒 Searches through the user's saved words collection.

```http
GET /api/v1/my-words/search?query=serendip&page=1&limit=10
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search term (min 1, max 100 characters) |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 10, max: 100) |

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "word-3",
      "word": "serendipity",
      "definition": "The occurrence of events by chance in a beneficial way",
      "notes": "Beautiful word",
      "addedAt": "2025-11-20T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Search results retrieved |
| 400 | Validation error |
| 401 | Unauthorized |

---

### 6. Get Word Count

🔒 Returns the total number of words in the user's collection.

```http
GET /api/v1/my-words/count
```

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "count": 42
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Word count retrieved |
| 401 | Unauthorized |

---

## LLM Endpoints

All LLM endpoints require authentication (🔒) and have stricter rate limiting.

**Rate Limit:** 20 requests per 15 minutes per user

### 1. Correct Text

🔒 Uses AI to identify and correct grammatical and spelling errors in text.

```http
POST /api/v1/llm/correct
```

**Headers:**

```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**

```json
{
  "text": "The quick brown fox jump over the lazy dog. Its a beautiful day.",
  "context": "Email to a professional colleague",
  "options": {
    "preserveFormatting": true,
    "suggestAlternatives": true
  }
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| text | string | Yes | Text to correct (max 5000 characters) |
| context | string | No | Context for better corrections (max 500 characters) |
| options.preserveFormatting | boolean | No | Preserve original formatting (default: true) |
| options.suggestAlternatives | boolean | No | Provide alternative corrections (default: true) |

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "original": "The quick brown fox jump over the lazy dog. Its a beautiful day.",
    "corrected": "The quick brown fox jumps over the lazy dog. It's a beautiful day.",
    "corrections": [
      {
        "original": "jump",
        "corrected": "jumps",
        "type": "grammar",
        "explanation": "Verb tense mismatch with subject 'fox' (singular)"
      },
      {
        "original": "Its",
        "corrected": "It's",
        "type": "spelling",
        "explanation": "Incorrect possessive; should be contraction of 'it is'"
      }
    ],
    "alternatives": [
      {
        "original": "The quick brown fox jumps over the lazy dog",
        "alternative": "Swiftly, the quick brown fox leaped over the lazy dog",
        "improvement": "More vivid and dynamic"
      }
    ]
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Text corrected successfully |
| 400 | Validation error |
| 401 | Unauthorized |
| 429 | Rate limit exceeded |
| 502 | AI service error |

---

### 2. Define Word

🔒 Uses AI to provide definitions and context for a word.

```http
POST /api/v1/llm/define
```

**Headers:**

```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**

```json
{
  "word": "ubiquitous",
  "context": "The ubiquitous smartphone has changed modern life"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| word | string | Yes | Word to define (1-50 characters, letters/hyphens/apostrophes only) |
| context | string | No | Sentence context for definition (max 500 characters) |

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "word": "ubiquitous",
    "definition": "Present, appearing, or found everywhere; constantly encountered",
    "pronunciation": "yoo-ˈbi-kwə-təs",
    "partOfSpeech": "adjective",
    "examples": [
      "Smartphones have become ubiquitous in modern society",
      "Social media is a ubiquitous presence in our daily lives"
    ],
    "synonyms": ["omnipresent", "prevalent", "universal", "pervasive"],
    "etymology": "From Latin ubique 'everywhere' + -ous suffix",
    "contextualUsage": "In this context, 'ubiquitous' emphasizes how widespread and all-encompassing smartphones are in modern life"
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Definition retrieved successfully |
| 400 | Validation error |
| 401 | Unauthorized |
| 429 | Rate limit exceeded |
| 502 | AI service error |

---

### 3. Generate Suggestions

🔒 Generates creative text suggestions based on specified type (paraphrase, expand, summarize, or improve).

```http
POST /api/v1/llm/suggestions
```

**Headers:**

```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**

```json
{
  "text": "The meeting was productive.",
  "type": "expand",
  "count": 3
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| text | string | Yes | Text to generate suggestions for (1-2000 characters) |
| type | enum | Yes | Type of suggestion: `paraphrase`, `expand`, `summarize`, `improve` |
| count | number | No | Number of suggestions (1-5, default: 3) |

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "original": "The meeting was productive.",
    "type": "expand",
    "suggestions": [
      {
        "suggestion": "The meeting proved to be highly productive, with all participants actively contributing ideas and reaching important consensus on key decisions.",
        "confidence": 0.92,
        "explanation": "Adds detail about participant engagement and outcomes"
      },
      {
        "suggestion": "We held a productive meeting that achieved all of our intended objectives and resulted in concrete action items for the team.",
        "confidence": 0.88,
        "explanation": "Emphasizes concrete outcomes"
      },
      {
        "suggestion": "The meeting was exceptionally productive, generating multiple innovative solutions and establishing clear next steps for our project.",
        "confidence": 0.85,
        "explanation": "Highlights innovation and clarity"
      }
    ]
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Suggestions generated successfully |
| 400 | Validation error (invalid type or count) |
| 401 | Unauthorized |
| 429 | Rate limit exceeded |
| 502 | AI service error |

---

### 4. Analyze Writing Style

🔒 Analyzes the writing style and provides feedback and recommendations.

```http
POST /api/v1/llm/analyze
```

**Headers:**

```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**

```json
{
  "text": "The quick brown fox jumps over the lazy dog. It was a sunny day. The fox was very fast. It jumped very high."
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| text | string | Yes | Text to analyze (1-5000 characters) |

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "analysis": {
      "tone": "neutral/narrative",
      "readability": {
        "score": 72,
        "level": "intermediate",
        "description": "Easily understood by most readers"
      },
      "clarity": {
        "score": 78,
        "issues": ["Repetitive sentence structure", "Weak verb usage"]
      },
      "style": {
        "activeVoice": 65,
        "passiveVoice": 35,
        "averageSentenceLength": 12,
        "wordVariety": "moderate"
      },
      "engagement": {
        "score": 68,
        "suggestions": ["Use more varied sentence starters", "Include more specific details"]
      }
    },
    "strengths": [
      "Clear subject-verb agreement",
      "Good use of transitional words"
    ],
    "improvements": [
      {
        "issue": "Repetitive use of 'It' - consider using varied pronouns or restructuring",
        "suggestion": "The quick brown fox jumps over the lazy dog on this beautiful sunny day, moving with remarkable speed and agility."
      },
      {
        "issue": "Weak verbs like 'was' could be replaced with stronger action verbs",
        "suggestion": "Consider using: shone, gleamed, moved, soared instead of 'was'"
      }
    ],
    "recommendations": [
      "Vary sentence length for better rhythm",
      "Use stronger, more specific verbs",
      "Consider combining short sentences for improved flow"
    ]
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Analysis completed successfully |
| 400 | Validation error |
| 401 | Unauthorized |
| 429 | Rate limit exceeded |
| 502 | AI service error |

---

## Settings Endpoints

All Settings endpoints require authentication (🔒).

### 1. Get User Settings

🔒 Retrieves the current user's preferences and settings.

```http
GET /api/v1/settings
```

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "llmModel": "gemini-1.5-pro",
    "preferredLanguage": "en",
    "theme": "dark",
    "emailNotifications": true,
    "createdAt": "2025-12-05T10:30:00Z",
    "updatedAt": "2025-12-05T14:50:00Z"
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Settings retrieved successfully |
| 401 | Unauthorized |

---

### 2. Update User Settings

🔒 Updates the user's preferences and settings.

```http
PATCH /api/v1/settings
```

**Headers:**

```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**

```json
{
  "llmModel": "gemini-1.5-pro",
  "preferredLanguage": "en",
  "theme": "dark",
  "emailNotifications": false
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| llmModel | string | No | LLM model to use |
| preferredLanguage | string | No | 2-character language code (e.g., 'en', 'es', 'fr') |
| theme | enum | No | User interface theme: `light` or `dark` |
| emailNotifications | boolean | No | Enable/disable email notifications |

**Response:**

```json
{
  "success": true,
  "message": "Settings updated",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "llmModel": "gemini-1.5-pro",
    "preferredLanguage": "en",
    "theme": "dark",
    "emailNotifications": false,
    "updatedAt": "2025-12-05T14:55:00Z"
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Settings updated successfully |
| 400 | Validation error |
| 401 | Unauthorized |

---

### 3. Reset Settings to Default

🔒 Resets all user settings to their default values.

```http
POST /api/v1/settings/reset
```

**Headers:**

```http
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{}
```

**Response:**

```json
{
  "success": true,
  "message": "Settings reset to default",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "llmModel": "gemini-1.5-pro",
    "preferredLanguage": "en",
    "theme": "light",
    "emailNotifications": true,
    "updatedAt": "2025-12-05T15:00:00Z"
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Settings reset successfully |
| 401 | Unauthorized |

---

## Health Endpoints

Health endpoints are public and do not require authentication.

### 1. Health Check

Gets comprehensive health status of all services.

```http
GET /api/v1/health
```

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "status": "healthy",
    "timestamp": "2025-12-05T15:05:00Z",
    "uptime": 3600.5,
    "services": {
      "database": true,
      "redis": true,
      "geminiAi": true
    },
    "version": "1.0.0",
    "responseTime": "145ms"
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | All services healthy |
| 503 | One or more services degraded |

---

### 2. Readiness Check

Checks if the service is ready to handle requests (for Kubernetes deployments).

```http
GET /api/v1/health/ready
```

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "ready": true
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Service ready |
| 503 | Service not ready |

---

### 3. Liveness Check

Checks if the service is alive and running (for Kubernetes deployments).

```http
GET /api/v1/health/live
```

**Response:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "alive": true
  }
}
```

**Status Codes:**

| Status | Description |
|--------|-------------|
| 200 | Service alive |

---

## Error Handling

The API uses standardized error responses. All error responses follow this format:

### Error Response Format

```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "details": {
    "field": "error details if applicable"
  },
  "timestamp": "2025-12-05T15:10:00Z"
}
```

### Error Codes Reference

| HTTP Status | Error Code | Description | Example |
|------------|-----------|-------------|---------|
| 400 | BAD_REQUEST | Invalid request format | Missing required fields |
| 400 | VALIDATION_ERROR | Validation failed | Invalid email format |
| 400 | INVALID_INPUT | Invalid input data | Password too short |
| 401 | UNAUTHORIZED | Authentication required | Missing authorization header |
| 401 | INVALID_CREDENTIALS | Invalid credentials | Wrong password |
| 401 | TOKEN_EXPIRED | Token has expired | Access token expired |
| 401 | TOKEN_INVALID | Token is invalid | Malformed JWT |
| 403 | FORBIDDEN | Access denied | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found | Word doesn't exist |
| 409 | CONFLICT | Resource already exists | Email already registered |
| 409 | EMAIL_ALREADY_EXISTS | Email in use | Email already registered |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests | Rate limit exceeded |
| 429 | TOO_MANY_REQUESTS | Request throttled | Too many simultaneous requests |
| 500 | INTERNAL_SERVER_ERROR | Server error | Unexpected error |
| 502 | EXTERNAL_API_ERROR | External service failed | AI service unavailable |
| 502 | AI_SERVICE_ERROR | AI service error | Gemini API error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily down | Database connection failed |

### Common Error Examples

#### Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "statusCode": 400,
  "details": {
    "email": "Invalid email format",
    "password": "Password must contain at least one number"
  }
}
```

#### Unauthorized Error

```json
{
  "success": false,
  "message": "Authentication required",
  "code": "UNAUTHORIZED",
  "statusCode": 401
}
```

#### Not Found Error

```json
{
  "success": false,
  "message": "Word not found",
  "code": "NOT_FOUND",
  "statusCode": 404,
  "details": {
    "word": "xyz123"
  }
}
```

#### Rate Limit Error

```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED",
  "statusCode": 429,
  "details": {
    "retryAfter": 300,
    "remaining": 0,
    "resetAt": "2025-12-05T15:20:00Z"
  }
}
```

---

## Rate Limiting

The API implements intelligent rate limiting to prevent abuse and ensure fair resource distribution.

### Rate Limiting Configuration

| Endpoint Category | Limit | Window | Description |
|------------------|-------|--------|-------------|
| General | 100 requests | 15 minutes | Default rate limit for most endpoints |
| Authentication | 5 requests | 15 minutes | Login/Register attempts (fails only count) |
| LLM/AI | 20 requests | 15 minutes | Per authenticated user |
| Per-User Custom | Configurable | Configurable | Custom limits for specific users |

### Rate Limit Headers

All responses include rate limit information in headers:

```http
HTTP/1.1 200 OK
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1733432400
```

**Header Meanings:**

- `RateLimit-Limit`: Total requests allowed in the window
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: Unix timestamp when the rate limit window resets

### Handling Rate Limits

When rate limited, the API returns a 429 status code:

```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED",
  "statusCode": 429,
  "details": {
    "retryAfter": 300,
    "remaining": 0,
    "resetAt": "2025-12-05T15:20:00Z"
  }
}
```

**Best Practices:**

1. **Implement exponential backoff** when rate limited
2. **Monitor RateLimit-Remaining** header to anticipate limits
3. **Cache responses** to reduce API calls
4. **Contact support** for higher rate limits if needed

### Rate Limit Behavior

- **Authentication endpoints** only count failed attempts (successful logins are not rate-limited)
- **LLM endpoints** have stricter limits to manage AI service costs
- **Failed requests** (4xx/5xx) still count against rate limits
- **Rate limits reset** every 15 minutes on a sliding window basis

---

## API Response Format

### Success Response

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Descriptive success message",
  "data": {
    "any": "response data"
  }
}
```

### Paginated Response

Endpoints that return lists include pagination info:

```json
{
  "success": true,
  "message": "Success",
  "data": [
    { "id": 1, "word": "example" }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

---

## Best Practices

### Security

1. **Store tokens securely** in HTTP-only cookies or secure storage
2. **Never expose tokens** in URLs or logs
3. **Use HTTPS only** in production
4. **Refresh tokens** before they expire
5. **Validate input** on the client side before sending

### Performance

1. **Cache responses** when possible
2. **Use pagination** for large data sets
3. **Minimize payload size** by requesting only needed fields
4. **Implement connection pooling** for multiple requests
5. **Monitor rate limit headers** to stay within limits

### Error Handling

1. **Implement retry logic** with exponential backoff for 5xx errors
2. **Handle rate limiting** gracefully (429 status)
3. **Log errors** with full context for debugging
4. **Provide user-friendly messages** based on error codes
5. **Check error details** for specific validation failures

### Development

1. **Use environment variables** for configuration
2. **Test with different rate limits** to ensure robustness
3. **Monitor API response times** for performance issues
4. **Keep tokens updated** before expiration
5. **Use request IDs** for tracking requests in logs

---

## Example Usage

### Complete Login Flow

```bash
# 1. Register a new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'

# Response includes accessToken and refreshToken

# 2. Use access token to access protected endpoints
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Refresh token when access token expires
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'

# 4. Logout when done
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Complete Word Workflow

```bash
# 1. Search for a word in the dictionary
curl -X GET "http://localhost:3000/api/v1/dictionary/search?query=serendipity" \
  -H "Authorization: Bearer {accessToken}"

# 2. Get the full definition
curl -X GET http://localhost:3000/api/v1/dictionary/word/serendipity/full \
  -H "Authorization: Bearer {accessToken}"

# 3. Save the word to personal collection
curl -X POST http://localhost:3000/api/v1/my-words \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "word": "serendipity",
    "notes": "Beautiful word meaning luck"
  }'

# 4. Search personal collection
curl -X GET "http://localhost:3000/api/v1/my-words/search?query=serendipity" \
  -H "Authorization: Bearer {accessToken}"
```

### Text Correction Workflow

```bash
# 1. Correct text
curl -X POST http://localhost:3000/api/v1/llm/correct \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The quick brown fox jump over the lazy dog.",
    "context": "Casual writing",
    "options": {
      "preserveFormatting": true,
      "suggestAlternatives": true
    }
  }'

# 2. Get writing analysis
curl -X POST http://localhost:3000/api/v1/llm/analyze \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The quick brown fox jumps over the lazy dog."
  }'

# 3. Generate text suggestions
curl -X POST http://localhost:3000/api/v1/llm/suggestions \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The meeting was productive.",
    "type": "expand",
    "count": 3
  }'
```

---

## Support & Contact

For API issues, questions, or feedback:

- **Documentation**: Review this API documentation
- **Status Page**: Check service status and incidents
- **Email**: support@prosepolish.com
- **GitHub Issues**: Report bugs and feature requests

---

**Last Updated:** December 5, 2025
**API Version:** v1
**ProsePolish Backend Version:** 1.0.0
