# Multi-Model AI Gateway Service - Design Document

**Issue:** #4 - Integrate Multi-Model AI Gateway Service into backend  
**Version:** 1.0  
**Date:** December 8, 2025  
**Status:** Design Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Goals & Objectives](#goals--objectives)
3. [System Architecture](#system-architecture)
4. [Component Design](#component-design)
5. [API Design](#api-design)
6. [Data Models](#data-models)
7. [Provider Adapters](#provider-adapters)
8. [Routing & Fallback Strategy](#routing--fallback-strategy)
9. [Quota & Cost Management](#quota--cost-management)
10. [Caching Strategy](#caching-strategy)
11. [Error Handling](#error-handling)
12. [Security & Authentication](#security--authentication)
13. [Monitoring & Observability](#monitoring--observability)
14. [Testing Strategy](#testing-strategy)
15. [Deployment Plan](#deployment-plan)
16. [Migration Path](#migration-path)
17. [Performance Considerations](#performance-considerations)
18. [Future Enhancements](#future-enhancements)

---

## Executive Summary

The Multi-Model AI Gateway Service is a backend module that provides intelligent routing, fallback, and workload distribution across multiple AI model providers. This service abstracts away provider-specific implementations and provides a unified interface for AI-powered features in ProsePolish.

### Key Benefits

- **Resilience**: Automatic fallback when providers fail or reach quota limits
- **Cost Optimization**: Intelligent routing based on cost, performance, and availability
- **Provider Flexibility**: Easy addition/removal of AI providers without changing client code
- **Unified Interface**: Single API for all AI operations regardless of underlying provider
- **Observability**: Comprehensive metrics and logging for AI operations

---

## Goals & Objectives

### Primary Goals

1. **High Availability**: Ensure AI features remain available even when individual providers fail
2. **Cost Efficiency**: Optimize provider selection to minimize API costs while maintaining quality
3. **Performance**: Minimize latency through intelligent caching and provider selection
4. **Extensibility**: Support easy addition of new AI providers and models

### Non-Goals (Phase 1)

- Real-time streaming responses (will be added in Phase 2)
- Fine-tuning custom models
- On-premise model hosting (local models via API only)
- Multi-modal capabilities (images, audio) beyond text

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                       │
│              (Writing Studio, Dictionary, Admin)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│                    /api/v1/ai/generate                          │
│            (Authentication, Rate Limiting, Validation)           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI Gateway Service Core                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Router/    │  │    Quota     │  │    Cache     │         │
│  │ Orchestrator │◄─┤   Manager    │  │   Manager    │         │
│  └──────┬───────┘  └──────────────┘  └──────────────┘         │
│         │                                                        │
│         ├────────────┬──────────────┬──────────────┬───────────┤
│         ▼            ▼              ▼              ▼           │
│  ┌──────────┐ ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ OpenAI   │ │ DeepSeek │  │HuggingFace│ │  Local   │       │
│  │ Adapter  │ │ Adapter  │  │  Adapter  │ │  Adapter │       │
│  └────┬─────┘ └────┬─────┘  └────┬─────┘  └────┬─────┘       │
└───────┼────────────┼─────────────┼─────────────┼──────────────┘
        │            │              │             │
        ▼            ▼              ▼             ▼
┌──────────┐ ┌──────────┐  ┌──────────┐  ┌──────────┐
│ OpenAI   │ │ DeepSeek │  │HuggingFace│ │  Local   │
│   API    │ │   API    │  │    API    │ │  Model   │
└──────────┘ └──────────┘  └──────────┘  └──────────┘
```

### Component Layers

1. **API Layer**: Express routes, middleware, request validation
2. **Gateway Core**: Orchestration, routing logic, business rules
3. **Adapter Layer**: Provider-specific implementations
4. **Support Services**: Caching, quota tracking, metrics collection
5. **External Providers**: Third-party AI APIs

---

## Component Design

### 1. Gateway Core (`AIGatewayService`)

**Responsibilities:**
- Accept generation requests from clients
- Select appropriate provider based on routing policy
- Manage request lifecycle (retry, fallback, timeout)
- Track usage and costs
- Return unified responses

**Key Methods:**
```typescript
class AIGatewayService {
  async generate(request: GenerateRequest): Promise<GenerateResponse>
  async health(): Promise<HealthStatus>
  async getMetrics(): Promise<GatewayMetrics>
  registerAdapter(adapter: ModelAdapter): void
  setRoutingPolicy(policy: RoutingPolicy): void
}
```

### 2. Router/Orchestrator (`ModelRouter`)

**Responsibilities:**
- Implement routing policies (cost-based, performance-based, round-robin)
- Execute fallback strategy on provider failure
- Apply circuit breaker pattern for failed providers
- Handle retries with exponential backoff

**Key Methods:**
```typescript
class ModelRouter {
  async selectProvider(request: GenerateRequest): Promise<ModelAdapter>
  async executeWithFallback(adapters: ModelAdapter[], request: GenerateRequest): Promise<GenerateResponse>
  recordProviderFailure(provider: string): void
  isProviderAvailable(provider: string): boolean
}
```

### 3. Model Adapter Interface

**Responsibilities:**
- Provide unified interface for all AI providers
- Handle provider-specific authentication and request formatting
- Transform provider responses to unified format
- Report health and availability

**Interface:**
```typescript
interface ModelAdapter {
  // Metadata
  providerName: string;
  modelId: string;
  capabilities: ModelCapabilities;
  
  // Core operations
  generate(prompt: string, options: GenerateOptions): Promise<GenerateResult>;
  health(): Promise<HealthStatus>;
  
  // Cost estimation
  estimateCost(prompt: string, options: GenerateOptions): Promise<CostEstimate>;
  
  // Quota management
  checkQuota(): Promise<QuotaStatus>;
  getRateLimit(): RateLimitInfo;
}
```

### 4. Quota Manager (`QuotaManager`)

**Responsibilities:**
- Track usage per user, provider, and model
- Enforce quota limits
- Calculate and track costs
- Store usage history

**Storage:**
- In-memory cache for fast access (Redis)
- Persistent storage for history (PostgreSQL)

### 5. Cache Manager (`AICache`)

**Responsibilities:**
- Cache identical requests to avoid duplicate API calls
- Implement cache invalidation strategies
- Support different TTL policies per provider

**Strategy:**
- Hash-based key generation (prompt + options → cache key)
- Redis for distributed caching
- Configurable TTL (default: 1 hour for completions)

---

## API Design

### Base Endpoint

```
POST /api/v1/ai/generate
```

### Request Format

```typescript
interface GenerateRequest {
  // Required fields
  prompt: string;                    // The text prompt
  
  // Optional fields
  model?: string;                    // Specific model (e.g., "gpt-4", "deepseek-chat")
  provider?: string;                 // Specific provider (e.g., "openai", "deepseek")
  routingPolicy?: RoutingPolicy;     // Override default routing
  
  // Generation options
  options?: {
    maxTokens?: number;              // Max tokens to generate (default: 1000)
    temperature?: number;            // Creativity level 0-2 (default: 0.7)
    topP?: number;                   // Nucleus sampling (default: 1.0)
    stopSequences?: string[];        // Stop generation at these sequences
    systemPrompt?: string;           // System message for chat models
  };
  
  // Behavior flags
  useCache?: boolean;                // Use cached responses (default: true)
  allowFallback?: boolean;           // Allow fallback to other providers (default: true)
  timeout?: number;                  // Max wait time in ms (default: 30000)
}
```

### Response Format

```typescript
interface GenerateResponse {
  success: boolean;
  data: {
    // Generated content
    output: string;
    
    // Metadata
    provider: string;                // Which provider was used
    model: string;                   // Which model was used
    cached: boolean;                 // Was this from cache?
    
    // Usage metrics
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    
    // Performance metrics
    latency: number;                 // Response time in ms
    costEstimate: {
      amount: number;
      currency: string;              // USD
    };
    
    // Optional warnings
    warnings?: string[];
  };
  timestamp: string;
}
```

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;                    // ERROR_CODE
    message: string;                 // Human-readable message
    provider?: string;               // Which provider failed
    details?: any;                   // Additional error details
  };
  timestamp: string;
}
```

### Additional Endpoints

```typescript
// Get service health
GET /api/v1/ai/health

// Get provider status
GET /api/v1/ai/providers

// Get usage statistics
GET /api/v1/ai/usage?userId={id}&timeRange={range}

// Get cost breakdown
GET /api/v1/ai/costs?timeRange={range}

// Admin: Update provider configuration
PATCH /api/v1/ai/providers/{providerId}/config
```

---

## Data Models

### Database Schema (Prisma)

```prisma
// AI Provider Configuration
model AIProvider {
  id            String   @id @default(cuid())
  name          String   @unique  // "openai", "deepseek", etc.
  displayName   String
  enabled       Boolean  @default(true)
  priority      Int      @default(0)
  
  // API Configuration
  apiKey        String?  @db.Text
  baseUrl       String?
  modelId       String   // Default model for this provider
  
  // Quota & Limits
  dailyQuotaLimit    Int?      // Max requests per day
  monthlyQuotaLimit  Int?      // Max requests per month
  rateLimitPerMinute Int?      // Requests per minute
  
  // Cost configuration
  costPerToken  Float?
  
  // Status tracking
  lastHealthCheck   DateTime?
  isHealthy         Boolean   @default(true)
  consecutiveFailures Int     @default(0)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("ai_providers")
}

// AI Usage Tracking
model AIUsage {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  
  // Request details
  provider      String
  model         String
  prompt        String   @db.Text
  output        String   @db.Text
  
  // Usage metrics
  promptTokens      Int
  completionTokens  Int
  totalTokens       Int
  
  // Cost tracking
  costAmount    Float
  costCurrency  String   @default("USD")
  
  // Performance metrics
  latency       Int      // milliseconds
  cached        Boolean  @default(false)
  
  // Status
  status        String   // "success", "error", "cached"
  errorMessage  String?  @db.Text
  
  createdAt     DateTime @default(now())
  
  @@map("ai_usage")
  @@index([userId, createdAt])
  @@index([provider, createdAt])
}

// AI Quota Tracking
model AIQuota {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  
  // Daily limits
  dailyRequests     Int      @default(0)
  dailyTokens       Int      @default(0)
  dailyLimit        Int      @default(1000)
  dailyResetAt      DateTime
  
  // Monthly limits
  monthlyRequests   Int      @default(0)
  monthlyTokens     Int      @default(0)
  monthlyLimit      Int      @default(10000)
  monthlyResetAt    DateTime
  
  // Cost tracking
  monthlySpend      Float    @default(0)
  monthlySpendLimit Float    @default(10.0)
  
  updatedAt     DateTime @updatedAt
  
  @@map("ai_quota")
}

// Provider Health History
model ProviderHealth {
  id            String   @id @default(cuid())
  provider      String
  
  isHealthy     Boolean
  latency       Int?     // milliseconds
  errorMessage  String?  @db.Text
  
  checkedAt     DateTime @default(now())
  
  @@map("provider_health")
  @@index([provider, checkedAt])
}
```

### TypeScript Types

```typescript
// Core types
type RoutingPolicy = 
  | 'cost-optimized'      // Prefer cheapest provider
  | 'performance'         // Prefer fastest provider
  | 'quality'            // Prefer best quality model
  | 'round-robin'        // Distribute load evenly
  | 'fallback-chain';    // Try providers in order

interface ModelCapabilities {
  maxTokens: number;
  supportsStreaming: boolean;
  supportsSystemPrompt: boolean;
  supportsFunctions: boolean;
}

interface HealthStatus {
  healthy: boolean;
  latency?: number;
  errorRate?: number;
  lastChecked: Date;
  message?: string;
}

interface QuotaStatus {
  remaining: number;
  limit: number;
  resetAt: Date;
}

interface RateLimitInfo {
  requestsPerMinute: number;
  requestsPerDay: number;
}

interface CostEstimate {
  amount: number;
  currency: string;
  breakdown: {
    promptCost: number;
    completionCost: number;
  };
}
```

---

## Provider Adapters

### 1. OpenAI Adapter

```typescript
class OpenAIAdapter implements ModelAdapter {
  providerName = 'openai';
  modelId: string; // 'gpt-4', 'gpt-3.5-turbo', etc.
  
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';
  
  async generate(prompt: string, options: GenerateOptions): Promise<GenerateResult> {
    // Implementation using OpenAI SDK
    const response = await this.client.chat.completions.create({
      model: this.modelId,
      messages: [
        { role: 'system', content: options.systemPrompt || '' },
        { role: 'user', content: prompt }
      ],
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      // ... other options
    });
    
    return this.transformResponse(response);
  }
  
  async health(): Promise<HealthStatus> {
    // Check API availability
  }
  
  async estimateCost(prompt: string, options: GenerateOptions): Promise<CostEstimate> {
    // OpenAI pricing: $0.03/1K prompt tokens, $0.06/1K completion tokens (GPT-4)
    const promptTokens = this.estimateTokens(prompt);
    const completionTokens = options.maxTokens || 1000;
    
    return {
      amount: (promptTokens * 0.03 / 1000) + (completionTokens * 0.06 / 1000),
      currency: 'USD',
      breakdown: {
        promptCost: promptTokens * 0.03 / 1000,
        completionCost: completionTokens * 0.06 / 1000
      }
    };
  }
  
  async checkQuota(): Promise<QuotaStatus> {
    // Check OpenAI quota via API
  }
  
  getRateLimit(): RateLimitInfo {
    return {
      requestsPerMinute: 3500,
      requestsPerDay: 10000
    };
  }
}
```

### 2. DeepSeek Adapter

```typescript
class DeepSeekAdapter implements ModelAdapter {
  providerName = 'deepseek';
  modelId = 'deepseek-chat'; // or 'deepseek-coder'
  
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com/v1';
  
  async generate(prompt: string, options: GenerateOptions): Promise<GenerateResult> {
    // DeepSeek API is OpenAI-compatible
    const response = await axios.post(`${this.baseUrl}/chat/completions`, {
      model: this.modelId,
      messages: [
        { role: 'system', content: options.systemPrompt || '' },
        { role: 'user', content: prompt }
      ],
      max_tokens: options.maxTokens,
      temperature: options.temperature,
    }, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    
    return this.transformResponse(response.data);
  }
  
  async estimateCost(prompt: string, options: GenerateOptions): Promise<CostEstimate> {
    // DeepSeek pricing: Much cheaper than OpenAI
    // $0.0014/1K prompt tokens, $0.0028/1K completion tokens
    const promptTokens = this.estimateTokens(prompt);
    const completionTokens = options.maxTokens || 1000;
    
    return {
      amount: (promptTokens * 0.0014 / 1000) + (completionTokens * 0.0028 / 1000),
      currency: 'USD',
      breakdown: {
        promptCost: promptTokens * 0.0014 / 1000,
        completionCost: completionTokens * 0.0028 / 1000
      }
    };
  }
}
```

### 3. HuggingFace Adapter

```typescript
class HuggingFaceAdapter implements ModelAdapter {
  providerName = 'huggingface';
  modelId: string; // e.g., 'mistralai/Mistral-7B-Instruct-v0.2'
  
  private apiKey: string;
  private baseUrl = 'https://api-inference.huggingface.co/models';
  
  async generate(prompt: string, options: GenerateOptions): Promise<GenerateResult> {
    const response = await axios.post(
      `${this.baseUrl}/${this.modelId}`,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: options.maxTokens,
          temperature: options.temperature,
          top_p: options.topP,
        }
      },
      {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      }
    );
    
    return this.transformResponse(response.data);
  }
  
  async estimateCost(prompt: string, options: GenerateOptions): Promise<CostEstimate> {
    // HuggingFace Inference API pricing varies by model
    // Free tier available, paid tier ~$0.0005/1K tokens
    return {
      amount: 0, // Free tier for now
      currency: 'USD',
      breakdown: { promptCost: 0, completionCost: 0 }
    };
  }
}
```

### 4. Local Model Adapter

```typescript
class LocalModelAdapter implements ModelAdapter {
  providerName = 'local';
  modelId: string;
  
  private inferenceUrl: string; // e.g., 'http://localhost:8000'
  
  async generate(prompt: string, options: GenerateOptions): Promise<GenerateResult> {
    // Call local inference server (e.g., llama.cpp, vLLM, Ollama)
    const response = await axios.post(`${this.inferenceUrl}/generate`, {
      prompt,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
    });
    
    return this.transformResponse(response.data);
  }
  
  async estimateCost(): Promise<CostEstimate> {
    // Local models have no API cost
    return {
      amount: 0,
      currency: 'USD',
      breakdown: { promptCost: 0, completionCost: 0 }
    };
  }
  
  getRateLimit(): RateLimitInfo {
    // Depends on local hardware
    return {
      requestsPerMinute: 60,
      requestsPerDay: 10000
    };
  }
}
```

---

## Routing & Fallback Strategy

### Routing Policies

#### 1. Cost-Optimized (Default)
```typescript
async selectProvider(request: GenerateRequest): Promise<ModelAdapter> {
  // 1. Filter available providers
  const available = this.adapters.filter(a => this.isHealthy(a));
  
  // 2. Estimate cost for each
  const costs = await Promise.all(
    available.map(async a => ({
      adapter: a,
      cost: await a.estimateCost(request.prompt, request.options)
    }))
  );
  
  // 3. Sort by cost (ascending)
  costs.sort((a, b) => a.cost.amount - b.cost.amount);
  
  // 4. Return cheapest healthy provider
  return costs[0].adapter;
}
```

#### 2. Performance-Based
```typescript
async selectProvider(request: GenerateRequest): Promise<ModelAdapter> {
  // Select based on historical latency metrics
  const available = this.adapters.filter(a => this.isHealthy(a));
  const metrics = await this.getLatencyMetrics(available);
  
  // Return fastest provider
  return metrics.sort((a, b) => a.avgLatency - b.avgLatency)[0].adapter;
}
```

#### 3. Quality-Based
```typescript
async selectProvider(request: GenerateRequest): Promise<ModelAdapter> {
  // Prefer higher-quality models (configured priority)
  const priorities = {
    'gpt-4': 10,
    'gpt-3.5-turbo': 7,
    'deepseek-chat': 8,
    'mistral-7b': 6
  };
  
  const available = this.adapters.filter(a => this.isHealthy(a));
  return available.sort((a, b) => 
    (priorities[b.modelId] || 0) - (priorities[a.modelId] || 0)
  )[0];
}
```

### Fallback Chain

```typescript
async executeWithFallback(
  adapters: ModelAdapter[], 
  request: GenerateRequest
): Promise<GenerateResponse> {
  
  const errors: Error[] = [];
  
  for (const adapter of adapters) {
    try {
      // Check circuit breaker
      if (!this.circuitBreaker.isAvailable(adapter.providerName)) {
        continue;
      }
      
      // Try generation
      const result = await this.retryWithBackoff(
        () => adapter.generate(request.prompt, request.options),
        { maxRetries: 2, baseDelay: 1000 }
      );
      
      // Success! Reset circuit breaker
      this.circuitBreaker.recordSuccess(adapter.providerName);
      
      return this.formatResponse(result, adapter);
      
    } catch (error) {
      // Record failure
      this.circuitBreaker.recordFailure(adapter.providerName);
      errors.push(error);
      
      // Log and continue to next provider
      logger.warn(`Provider ${adapter.providerName} failed: ${error.message}`);
    }
  }
  
  // All providers failed
  throw new AllProvidersFailedError(errors);
}
```

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private state: Map<string, CircuitState> = new Map();
  
  private readonly FAILURE_THRESHOLD = 5;
  private readonly TIMEOUT_DURATION = 60000; // 1 minute
  private readonly HALF_OPEN_REQUESTS = 3;
  
  isAvailable(provider: string): boolean {
    const state = this.getState(provider);
    
    if (state.status === 'closed') {
      return true;
    }
    
    if (state.status === 'open') {
      // Check if timeout has elapsed
      if (Date.now() - state.openedAt > this.TIMEOUT_DURATION) {
        this.setState(provider, { status: 'half-open', attempts: 0 });
        return true;
      }
      return false;
    }
    
    if (state.status === 'half-open') {
      return state.attempts < this.HALF_OPEN_REQUESTS;
    }
    
    return true;
  }
  
  recordSuccess(provider: string): void {
    this.setState(provider, { status: 'closed', failures: 0 });
  }
  
  recordFailure(provider: string): void {
    const state = this.getState(provider);
    
    if (state.status === 'half-open') {
      // Failed during half-open, reopen circuit
      this.setState(provider, { 
        status: 'open', 
        openedAt: Date.now() 
      });
      return;
    }
    
    state.failures++;
    
    if (state.failures >= this.FAILURE_THRESHOLD) {
      this.setState(provider, { 
        status: 'open', 
        openedAt: Date.now() 
      });
    }
  }
}
```

---

## Quota & Cost Management

### User Quota Tracking

```typescript
class QuotaManager {
  async checkQuota(userId: string): Promise<boolean> {
    const quota = await prisma.aIQuota.findUnique({
      where: { userId }
    });
    
    // Check daily limit
    if (quota.dailyRequests >= quota.dailyLimit) {
      throw new QuotaExceededError('Daily request limit reached');
    }
    
    // Check monthly limit
    if (quota.monthlyRequests >= quota.monthlyLimit) {
      throw new QuotaExceededError('Monthly request limit reached');
    }
    
    // Check spend limit
    if (quota.monthlySpend >= quota.monthlySpendLimit) {
      throw new QuotaExceededError('Monthly spend limit reached');
    }
    
    return true;
  }
  
  async recordUsage(userId: string, usage: UsageRecord): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Update quota
      await tx.aIQuota.update({
        where: { userId },
        data: {
          dailyRequests: { increment: 1 },
          dailyTokens: { increment: usage.totalTokens },
          monthlyRequests: { increment: 1 },
          monthlyTokens: { increment: usage.totalTokens },
          monthlySpend: { increment: usage.cost }
        }
      });
      
      // Record usage history
      await tx.aIUsage.create({
        data: {
          userId,
          provider: usage.provider,
          model: usage.model,
          prompt: usage.prompt,
          output: usage.output,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
          costAmount: usage.cost,
          latency: usage.latency,
          cached: usage.cached,
          status: 'success'
        }
      });
    });
  }
  
  async resetDailyQuota(): Promise<void> {
    // Cron job to reset daily quotas at midnight
    await prisma.aIQuota.updateMany({
      data: {
        dailyRequests: 0,
        dailyTokens: 0,
        dailyResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
  }
  
  async resetMonthlyQuota(): Promise<void> {
    // Cron job to reset monthly quotas on 1st of month
    await prisma.aIQuota.updateMany({
      data: {
        monthlyRequests: 0,
        monthlyTokens: 0,
        monthlySpend: 0,
        monthlyResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
  }
}
```

---

## Caching Strategy

### Cache Key Generation

```typescript
class AICache {
  private redis: Redis;
  private defaultTTL = 3600; // 1 hour
  
  generateCacheKey(request: GenerateRequest): string {
    // Create hash from prompt + options
    const data = {
      prompt: request.prompt,
      model: request.model,
      maxTokens: request.options?.maxTokens,
      temperature: request.options?.temperature,
      systemPrompt: request.options?.systemPrompt
    };
    
    return `ai:cache:${crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')}`;
  }
  
  async get(request: GenerateRequest): Promise<GenerateResponse | null> {
    if (!request.useCache) return null;
    
    const key = this.generateCacheKey(request);
    const cached = await this.redis.get(key);
    
    if (cached) {
      const response = JSON.parse(cached);
      response.data.cached = true;
      return response;
    }
    
    return null;
  }
  
  async set(
    request: GenerateRequest, 
    response: GenerateResponse,
    ttl?: number
  ): Promise<void> {
    const key = this.generateCacheKey(request);
    await this.redis.setex(
      key, 
      ttl || this.defaultTTL, 
      JSON.stringify(response)
    );
  }
  
  async invalidate(pattern: string): Promise<void> {
    // Clear cache by pattern (e.g., all OpenAI responses)
    const keys = await this.redis.keys(`ai:cache:${pattern}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

---

## Error Handling

### Error Types

```typescript
class AIGatewayError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public provider?: string
  ) {
    super(message);
    this.name = 'AIGatewayError';
  }
}

class QuotaExceededError extends AIGatewayError {
  constructor(message: string) {
    super(message, 'QUOTA_EXCEEDED', 429);
  }
}

class AllProvidersFailedError extends AIGatewayError {
  constructor(public errors: Error[]) {
    super(
      'All AI providers failed to generate response',
      'ALL_PROVIDERS_FAILED',
      503
    );
  }
}

class ProviderTimeoutError extends AIGatewayError {
  constructor(provider: string) {
    super(
      `Provider ${provider} timed out`,
      'PROVIDER_TIMEOUT',
      504,
      provider
    );
  }
}

class InvalidRequestError extends AIGatewayError {
  constructor(message: string) {
    super(message, 'INVALID_REQUEST', 400);
  }
}
```

### Error Recovery

```typescript
class ErrorHandler {
  handleProviderError(error: any, provider: string): AIGatewayError {
    // Map provider-specific errors to gateway errors
    
    if (error.status === 429) {
      return new QuotaExceededError(`Provider ${provider} rate limit exceeded`);
    }
    
    if (error.status === 401) {
      return new AIGatewayError(
        `Provider ${provider} authentication failed`,
        'AUTH_FAILED',
        401,
        provider
      );
    }
    
    if (error.code === 'ETIMEDOUT') {
      return new ProviderTimeoutError(provider);
    }
    
    return new AIGatewayError(
      error.message,
      'PROVIDER_ERROR',
      500,
      provider
    );
  }
  
  async logError(error: AIGatewayError, context: any): Promise<void> {
    logger.error({
      error: error.message,
      code: error.code,
      provider: error.provider,
      context,
      stack: error.stack
    });
    
    // Could send to error tracking service (Sentry, etc.)
  }
}
```

---

## Security & Authentication

### API Authentication

```typescript
// Middleware for AI Gateway endpoints
const aiGatewayAuth = asyncHandler(async (req, res, next) => {
  // Require authentication
  if (!req.userId) {
    throw new UnauthorizedError('Authentication required for AI services');
  }
  
  // Check user has AI access permission
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { role: true }
  });
  
  if (!user || !['user', 'admin'].includes(user.role)) {
    throw new ForbiddenError('Insufficient permissions for AI services');
  }
  
  next();
});
```

### Provider API Key Management

```typescript
class APIKeyManager {
  private keys: Map<string, string> = new Map();
  
  constructor() {
    // Load from environment variables
    this.loadFromEnv();
  }
  
  private loadFromEnv(): void {
    this.keys.set('openai', process.env.OPENAI_API_KEY || '');
    this.keys.set('deepseek', process.env.DEEPSEEK_API_KEY || '');
    this.keys.set('huggingface', process.env.HUGGINGFACE_API_KEY || '');
  }
  
  getKey(provider: string): string {
    const key = this.keys.get(provider);
    if (!key) {
      throw new Error(`No API key configured for provider: ${provider}`);
    }
    return key;
  }
  
  // For admin to update keys without restart
  async updateKey(provider: string, key: string): Promise<void> {
    this.keys.set(provider, key);
    // Also persist to secure storage (e.g., AWS Secrets Manager)
  }
}
```

### Input Validation

```typescript
const generateRequestSchema = z.object({
  prompt: z.string().min(1).max(10000),
  model: z.string().optional(),
  provider: z.string().optional(),
  routingPolicy: z.enum([
    'cost-optimized',
    'performance',
    'quality',
    'round-robin',
    'fallback-chain'
  ]).optional(),
  options: z.object({
    maxTokens: z.number().min(1).max(4000).optional(),
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
    stopSequences: z.array(z.string()).max(4).optional(),
    systemPrompt: z.string().max(2000).optional()
  }).optional(),
  useCache: z.boolean().optional(),
  allowFallback: z.boolean().optional(),
  timeout: z.number().min(1000).max(60000).optional()
});
```

---

## Monitoring & Observability

### Metrics Collection

```typescript
class GatewayMetrics {
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cachedRequests: 0,
    
    // Per-provider metrics
    providerRequests: new Map<string, number>(),
    providerErrors: new Map<string, number>(),
    providerLatency: new Map<string, number[]>(),
    
    // Cost tracking
    totalCost: 0,
    costByProvider: new Map<string, number>(),
    
    // Token usage
    totalTokens: 0,
    tokensByProvider: new Map<string, number>()
  };
  
  recordRequest(
    provider: string,
    success: boolean,
    cached: boolean,
    latency: number,
    tokens: number,
    cost: number
  ): void {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
      this.incrementMap(this.metrics.providerErrors, provider);
    }
    
    if (cached) {
      this.metrics.cachedRequests++;
    }
    
    this.incrementMap(this.metrics.providerRequests, provider);
    this.addToArray(this.metrics.providerLatency, provider, latency);
    
    this.metrics.totalCost += cost;
    this.incrementMap(this.metrics.costByProvider, provider, cost);
    
    this.metrics.totalTokens += tokens;
    this.incrementMap(this.metrics.tokensByProvider, provider, tokens);
  }
  
  getMetrics(): GatewayMetricsSnapshot {
    return {
      ...this.metrics,
      avgLatency: this.calculateAvgLatency(),
      successRate: this.metrics.successfulRequests / this.metrics.totalRequests,
      cacheHitRate: this.metrics.cachedRequests / this.metrics.totalRequests
    };
  }
}
```

### Health Checks

```typescript
// Provider health check job (runs every 5 minutes)
const healthCheckJob = new CronJob('*/5 * * * *', async () => {
  const adapters = aiGateway.getAdapters();
  
  for (const adapter of adapters) {
    try {
      const health = await adapter.health();
      
      await prisma.providerHealth.create({
        data: {
          provider: adapter.providerName,
          isHealthy: health.healthy,
          latency: health.latency,
          errorMessage: health.message
        }
      });
      
      // Update provider status
      await prisma.aIProvider.update({
        where: { name: adapter.providerName },
        data: {
          isHealthy: health.healthy,
          lastHealthCheck: new Date(),
          consecutiveFailures: health.healthy ? 0 : { increment: 1 }
        }
      });
      
    } catch (error) {
      logger.error(`Health check failed for ${adapter.providerName}:`, error);
    }
  }
});
```

### Logging

```typescript
// Structured logging for AI operations
logger.info('AI generation request', {
  userId: req.userId,
  provider: selectedProvider,
  model: selectedModel,
  promptLength: request.prompt.length,
  routingPolicy: request.routingPolicy
});

logger.info('AI generation response', {
  userId: req.userId,
  provider: response.provider,
  model: response.model,
  cached: response.cached,
  latency: response.latency,
  tokens: response.usage.totalTokens,
  cost: response.costEstimate.amount
});

logger.error('AI generation failed', {
  userId: req.userId,
  provider: failedProvider,
  error: error.message,
  retriesAttempted: retryCount,
  fallbackTriggered: usedFallback
});
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('ModelRouter', () => {
  it('should select cheapest provider with cost-optimized policy', async () => {
    const router = new ModelRouter([openAI, deepSeek, huggingFace]);
    router.setPolicy('cost-optimized');
    
    const provider = await router.selectProvider(mockRequest);
    expect(provider.providerName).toBe('deepseek');
  });
  
  it('should fallback to next provider on failure', async () => {
    // Mock first provider to fail
    openAI.generate = jest.fn().mockRejectedValue(new Error('API Error'));
    
    const result = await router.executeWithFallback(
      [openAI, deepSeek],
      mockRequest
    );
    
    expect(result.provider).toBe('deepseek');
  });
  
  it('should open circuit breaker after threshold failures', async () => {
    const breaker = new CircuitBreaker();
    
    for (let i = 0; i < 5; i++) {
      breaker.recordFailure('openai');
    }
    
    expect(breaker.isAvailable('openai')).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe('AI Gateway Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    await startTestServer();
  });
  
  it('should generate response with OpenAI', async () => {
    const response = await request(app)
      .post('/api/v1/ai/generate')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        prompt: 'Write a haiku about programming',
        model: 'gpt-3.5-turbo'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.output).toBeTruthy();
    expect(response.body.data.provider).toBe('openai');
  });
  
  it('should enforce quota limits', async () => {
    // Set low quota for test user
    await prisma.aIQuota.update({
      where: { userId: testUserId },
      data: { dailyLimit: 1, dailyRequests: 1 }
    });
    
    const response = await request(app)
      .post('/api/v1/ai/generate')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ prompt: 'Test' });
    
    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('QUOTA_EXCEEDED');
  });
  
  it('should use cached responses', async () => {
    const prompt = 'Unique test prompt ' + Date.now();
    
    // First request
    const response1 = await request(app)
      .post('/api/v1/ai/generate')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ prompt });
    
    expect(response1.body.data.cached).toBe(false);
    
    // Second request (should be cached)
    const response2 = await request(app)
      .post('/api/v1/ai/generate')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ prompt });
    
    expect(response2.body.data.cached).toBe(true);
    expect(response2.body.data.output).toBe(response1.body.data.output);
  });
});
```

### E2E Tests

```typescript
describe('AI Gateway E2E', () => {
  it('should handle complete user workflow', async () => {
    // 1. User registers and logs in
    const { token } = await registerAndLogin();
    
    // 2. User generates text
    const generation = await generateText(token, 'Write a story');
    expect(generation.success).toBe(true);
    
    // 3. Check usage was recorded
    const usage = await getUsage(token);
    expect(usage.totalRequests).toBeGreaterThan(0);
    
    // 4. Check cost was calculated
    expect(usage.totalCost).toBeGreaterThan(0);
    
    // 5. Verify quota was updated
    const quota = await getQuota(token);
    expect(quota.dailyRequests).toBeGreaterThan(0);
  });
});
```

---

## Deployment Plan

### Phase 1: Foundation (Week 1)

**Tasks:**
1. Set up project structure and dependencies
2. Implement core interfaces (ModelAdapter, Router)
3. Create OpenAI adapter (primary provider)
4. Basic request/response handling
5. Add authentication and authorization
6. Set up database schema and migrations
7. Basic unit tests

**Deliverable:** Working endpoint with single provider

### Phase 2: Multi-Provider Support (Week 2)

**Tasks:**
1. Implement DeepSeek adapter
2. Implement routing policies
3. Add fallback mechanism
4. Implement circuit breaker pattern
5. Add quota management
6. Integration tests

**Deliverable:** Multi-provider routing with fallback

### Phase 3: Optimization (Week 3)

**Tasks:**
1. Implement caching layer
2. Add HuggingFace adapter
3. Optimize provider selection algorithm
4. Performance testing and tuning
5. Add metrics collection
6. E2E tests

**Deliverable:** Production-ready service with caching

### Phase 4: Observability & Admin (Week 4)

**Tasks:**
1. Add comprehensive logging
2. Health check endpoints
3. Admin dashboard for provider management
4. Usage analytics endpoints
5. Documentation and API reference
6. Load testing

**Deliverable:** Fully observable system ready for production

---

## Migration Path

### Existing Gemini Integration

Current code using Gemini directly:

```typescript
// Old way (direct Gemini usage)
import { geminiClient } from '../config/gemini';

const result = await geminiClient.generateContent(prompt);
const text = result.response.text();
```

New way (via AI Gateway):

```typescript
// New way (via AI Gateway)
import { aiGateway } from '../services/aiGateway';

const response = await aiGateway.generate({
  prompt,
  routingPolicy: 'cost-optimized',
  allowFallback: true
});
const text = response.data.output;
```

### Migration Strategy

1. **Keep Gemini as fallback**: Don't remove existing Gemini code immediately
2. **Feature flag**: Use environment variable to toggle between old and new
3. **Gradual rollout**: Start with non-critical features (dictionary suggestions)
4. **Monitor carefully**: Track errors, latency, costs
5. **Full cutover**: Once stable, remove old code

---

## Performance Considerations

### Latency Optimization

- **Parallel health checks**: Don't block on provider health checks
- **Connection pooling**: Reuse HTTP connections to providers
- **Request timeout**: Set aggressive timeouts (30s max)
- **Cache warm-up**: Pre-load common prompts during low traffic

### Cost Optimization

- **Aggressive caching**: Cache responses for 1-24 hours based on use case
- **Smart routing**: Prefer cheaper providers for simple tasks
- **Token limits**: Enforce reasonable limits on prompt/completion length
- **Batch requests**: Group similar requests when possible

### Scalability

- **Horizontal scaling**: Service is stateless (uses Redis for state)
- **Rate limiting**: Prevent abuse and quota exhaustion
- **Queue system**: Add request queue for high load (future enhancement)
- **Database optimization**: Index on userId, provider, createdAt

---

## Future Enhancements

### Phase 2 Features

1. **Streaming responses**: Real-time token streaming for better UX
2. **Function calling**: Support for OpenAI function calling
3. **Embeddings API**: Separate endpoint for text embeddings
4. **Fine-tuned models**: Support for custom model endpoints
5. **Multi-modal**: Support for image inputs/outputs

### Phase 3 Features

1. **Advanced routing**: ML-based provider selection
2. **A/B testing**: Compare provider outputs automatically
3. **Quality scoring**: Track and optimize for output quality
4. **User preferences**: Per-user provider preferences
5. **Prompt templates**: Reusable prompt library with versioning

### Infrastructure

1. **Message queue**: Add RabbitMQ/SQS for async processing
2. **Monitoring**: Grafana dashboards for real-time metrics
3. **Alerting**: PagerDuty integration for provider failures
4. **Data pipeline**: Export usage data to analytics warehouse
5. **Cost prediction**: Forecast monthly costs based on usage trends

---

## Success Metrics

### Technical Metrics

- **Availability**: 99.9% uptime for AI services
- **Latency P95**: < 3 seconds for non-cached requests
- **Cache hit rate**: > 40%
- **Fallback success rate**: > 95% when primary provider fails
- **Error rate**: < 0.1%

### Business Metrics

- **Cost reduction**: 30-50% reduction in AI API costs
- **User satisfaction**: No degradation in response quality
- **Feature adoption**: 80% of AI features using gateway within 3 months
- **Provider diversity**: At least 3 active providers

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Provider API changes | High | Medium | Version adapters, monitor provider changelogs |
| Quota exhaustion | High | Low | Implement quota warnings, budget alerts |
| Latency increase | Medium | Medium | Aggressive caching, timeout optimization |
| Quality degradation | High | Low | A/B testing, quality metrics, rollback plan |
| Cost overrun | Medium | Medium | Strict quota limits, cost monitoring, alerts |
| Circuit breaker false positives | Low | Medium | Tunable thresholds, manual override |

---

## Appendix

### Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=2000

# DeepSeek Configuration
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-chat

# HuggingFace Configuration
HUGGINGFACE_API_KEY=...
HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2

# Local Model Configuration (optional)
LOCAL_MODEL_URL=http://localhost:8000
LOCAL_MODEL_NAME=llama-2-7b

# Gateway Configuration
AI_GATEWAY_DEFAULT_POLICY=cost-optimized
AI_GATEWAY_CACHE_TTL=3600
AI_GATEWAY_REQUEST_TIMEOUT=30000
AI_GATEWAY_MAX_RETRIES=2

# Quota Configuration
AI_QUOTA_DAILY_LIMIT=1000
AI_QUOTA_MONTHLY_LIMIT=10000
AI_QUOTA_MONTHLY_SPEND_LIMIT=10.00
```

### API Examples

```bash
# Basic generation request
curl -X POST http://localhost:3000/api/v1/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a professional email introducing yourself",
    "options": {
      "maxTokens": 500,
      "temperature": 0.7
    }
  }'

# Specify provider and disable cache
curl -X POST http://localhost:3000/api/v1/ai/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in simple terms",
    "provider": "openai",
    "model": "gpt-4",
    "useCache": false,
    "options": {
      "temperature": 0.5,
      "systemPrompt": "You are a science educator."
    }
  }'

# Get usage statistics
curl -X GET "http://localhost:3000/api/v1/ai/usage?timeRange=7d" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get provider status
curl -X GET http://localhost:3000/api/v1/ai/providers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Document Version:** 1.0  
**Last Updated:** December 8, 2025  
**Next Review:** Before implementation start  
**Owner:** Development Team
