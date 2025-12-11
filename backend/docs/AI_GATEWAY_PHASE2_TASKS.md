# AI Gateway - Phase 2 Task List

**Version:** 1.0
**Created:** December 10, 2025
**Status:** Planning

---

## Overview

Phase 2 focuses on multi-provider support, advanced routing, caching, and user model selection features. This phase will enable true provider flexibility, cost optimization, and user empowerment.

**Estimated Total Time:** 4-5 weeks

---

## Table of Contents

1. [Additional Provider Adapters](#1-additional-provider-adapters)
2. [Advanced Routing & Orchestration](#2-advanced-routing--orchestration)
3. [Circuit Breaker Pattern](#3-circuit-breaker-pattern)
4. [Caching Layer](#4-caching-layer)
5. [User Model Preferences](#5-user-model-preferences)
6. [Models Listing API](#6-models-listing-api)
7. [Admin Management Endpoints](#7-admin-management-endpoints)
8. [Performance Optimization](#8-performance-optimization)
9. [Enhanced Monitoring](#9-enhanced-monitoring)
10. [Frontend Integration](#10-frontend-integration)
11. [Documentation & Testing](#11-documentation--testing)

---

## 1. Additional Provider Adapters

### 1.1 DeepSeek Adapter
**File:** `src/services/AIGateway/adapters/DeepSeekAdapter.ts`

**Tasks:**
- [ ] Create DeepSeekAdapter class implementing ModelAdapter
- [ ] Implement `generate()` method with DeepSeek API
- [ ] Implement cost estimation (cheaper than OpenAI)
- [ ] Add error handling specific to DeepSeek
- [ ] Implement health check
- [ ] Add rate limit information
- [ ] Create adapter tests

**Pricing:**
- Prompt: $0.0014/1K tokens
- Completion: $0.0028/1K tokens

**Estimated Time:** 3 hours

---

### 1.2 HuggingFace Adapter
**File:** `src/services/AIGateway/adapters/HuggingFaceAdapter.ts`

**Tasks:**
- [ ] Create HuggingFaceAdapter class
- [ ] Support multiple HuggingFace models (Mistral, Llama, etc.)
- [ ] Implement Inference API integration
- [ ] Add model-specific transformations
- [ ] Handle rate limiting (free tier)
- [ ] Implement cost estimation (free tier support)
- [ ] Create adapter tests

**Estimated Time:** 4 hours

---

### 1.3 Local Model Adapter
**File:** `src/services/AIGateway/adapters/LocalModelAdapter.ts`

**Tasks:**
- [ ] Create LocalModelAdapter for self-hosted models
- [ ] Support multiple inference server types:
  - [ ] llama.cpp server
  - [ ] vLLM
  - [ ] Ollama
- [ ] Add configuration for local endpoints
- [ ] Zero-cost estimation
- [ ] Health check for local server
- [ ] Create adapter tests

**Estimated Time:** 3 hours

---

### 1.4 Adapter Registration
**File:** `src/services/AIGateway/index.ts`

**Tasks:**
- [ ] Register DeepSeek adapter with configuration
- [ ] Register HuggingFace adapter with configuration
- [ ] Register Local adapter if configured
- [ ] Add adapter discovery mechanism
- [ ] Environment variable configuration for all adapters
- [ ] Validation for adapter registration

**Estimated Time:** 1 hour

---

## 2. Advanced Routing & Orchestration

### 2.1 Create ModelRouter Service
**File:** `src/services/AIGateway/core/ModelRouter.ts`

**Tasks:**
- [ ] Create ModelRouter class
- [ ] Implement `selectProvider()` method
- [ ] Add routing policy enum/types
- [ ] Implement user preference routing (priority)
- [ ] Implement cost-optimized routing
- [ ] Implement performance-based routing
- [ ] Implement quality-based routing
- [ ] Implement round-robin routing
- [ ] Add adapter availability checking
- [ ] Create router tests

**Estimated Time:** 6 hours

---

### 2.2 Implement Routing Policies

#### 2.2.1 User Preference Policy
**Tasks:**
- [ ] Check user preferences from database
- [ ] Match preference to available adapter
- [ ] Update last used timestamp
- [ ] Increment usage count
- [ ] Fallback to default if preference unavailable

**Estimated Time:** 2 hours

---

#### 2.2.2 Cost-Optimized Policy
**Tasks:**
- [ ] Estimate cost for each available provider
- [ ] Sort by cost (ascending)
- [ ] Select cheapest healthy provider
- [ ] Log cost comparison for analytics

**Estimated Time:** 2 hours

---

#### 2.2.3 Performance-Based Policy
**Tasks:**
- [ ] Query historical latency metrics from database
- [ ] Calculate average latency per provider
- [ ] Select fastest provider
- [ ] Consider recent performance (weighted average)

**Estimated Time:** 2 hours

---

#### 2.2.4 Quality-Based Policy
**Tasks:**
- [ ] Define quality scores per model
- [ ] Load quality configuration
- [ ] Select highest quality available model
- [ ] Consider user feedback scores (future)

**Estimated Time:** 1.5 hours

---

#### 2.2.5 Round-Robin Policy
**Tasks:**
- [ ] Maintain round-robin counter
- [ ] Distribute requests evenly across providers
- [ ] Skip unhealthy providers
- [ ] Reset counter periodically

**Estimated Time:** 1 hour

---

### 2.3 Fallback Chain Implementation
**File:** `src/services/AIGateway/core/ModelRouter.ts`

**Tasks:**
- [ ] Implement `executeWithFallback()` method
- [ ] Try primary provider first
- [ ] On failure, try next in chain
- [ ] Collect errors from each attempt
- [ ] Return first successful result
- [ ] Throw AllProvidersFailedError if all fail
- [ ] Log fallback chain execution

**Estimated Time:** 3 hours

---

### 2.4 Retry with Exponential Backoff
**File:** `src/services/AIGateway/utils/retry.ts`

**Tasks:**
- [ ] Create retry utility function
- [ ] Implement exponential backoff algorithm
- [ ] Add jitter to prevent thundering herd
- [ ] Configure max retries (default: 2)
- [ ] Configure base delay (default: 1000ms)
- [ ] Add retry tests

**Estimated Time:** 2 hours

---

## 3. Circuit Breaker Pattern

### 3.1 Create CircuitBreaker Service
**File:** `src/services/AIGateway/core/CircuitBreaker.ts`

**Tasks:**
- [ ] Create CircuitBreaker class
- [ ] Implement three states: closed, open, half-open
- [ ] Track failure count per provider
- [ ] Configure failure threshold (default: 5)
- [ ] Configure timeout duration (default: 60s)
- [ ] Implement `isAvailable()` method
- [ ] Implement `recordSuccess()` method
- [ ] Implement `recordFailure()` method
- [ ] Add state transition logic
- [ ] Create circuit breaker tests

**Estimated Time:** 4 hours

---

### 3.2 Integrate Circuit Breaker
**Tasks:**
- [ ] Add circuit breaker to ModelRouter
- [ ] Check breaker before provider selection
- [ ] Skip providers with open circuit
- [ ] Record success/failure after requests
- [ ] Log circuit breaker state changes
- [ ] Add metrics for circuit breaker events

**Estimated Time:** 2 hours

---

## 4. Caching Layer

### 4.1 Create AICache Service
**File:** `src/services/AIGateway/core/AICache.ts`

**Tasks:**
- [ ] Create AICache class
- [ ] Initialize Redis connection
- [ ] Implement cache key generation (SHA-256 hash)
- [ ] Implement `get()` method
- [ ] Implement `set()` method with TTL
- [ ] Implement `invalidate()` method
- [ ] Add cache statistics tracking
- [ ] Configure default TTL (1 hour)
- [ ] Handle Redis connection errors gracefully
- [ ] Create cache tests

**Estimated Time:** 4 hours

---

### 4.2 Cache Key Generation
**Tasks:**
- [ ] Hash prompt content
- [ ] Include model in hash
- [ ] Include generation options in hash
- [ ] Include system prompt in hash
- [ ] Exclude user-specific data from hash
- [ ] Implement deterministic JSON serialization

**Estimated Time:** 1.5 hours

---

### 4.3 Cache Integration
**File:** `src/services/AIGateway/core/AIGatewayService.ts`

**Tasks:**
- [ ] Check cache before generation
- [ ] Return cached result if found
- [ ] Mark response as cached
- [ ] Store result in cache after generation
- [ ] Respect `useCache` flag from request
- [ ] Add cache hit/miss metrics
- [ ] Log cache operations

**Estimated Time:** 2 hours

---

### 4.4 Cache Invalidation Strategy
**Tasks:**
- [ ] Implement pattern-based invalidation
- [ ] Add TTL-based expiration
- [ ] Create manual cache clearing endpoint (admin)
- [ ] Implement cache warming for common prompts
- [ ] Add cache size monitoring

**Estimated Time:** 2 hours

---

## 5. User Model Preferences

### 5.1 Preferences API Endpoints

#### 5.1.1 Get User Preferences
**File:** `src/controllers/aiGateway.controller.ts`

**Tasks:**
- [ ] Implement `getUserPreferences()` controller
- [ ] Fetch preferences from database
- [ ] Include provider and model display names
- [ ] Include usage statistics
- [ ] Format response with preference details
- [ ] Handle no preferences case

**Route:** `GET /api/v1/ai/preferences`

**Estimated Time:** 2 hours

---

#### 5.1.2 Update User Preference
**File:** `src/controllers/aiGateway.controller.ts`

**Tasks:**
- [ ] Implement `updateUserPreference()` controller
- [ ] Validate provider and model exist
- [ ] Create or update preference record
- [ ] Support context-specific preferences
- [ ] Handle unique constraint (userId + context)
- [ ] Return updated preference
- [ ] Add validation for invalid models

**Route:** `PUT /api/v1/ai/preferences`

**Estimated Time:** 2 hours

---

#### 5.1.3 Delete User Preference
**File:** `src/controllers/aiGateway.controller.ts`

**Tasks:**
- [ ] Implement `deleteUserPreference()` controller
- [ ] Delete specific preference by context
- [ ] Return success confirmation
- [ ] Handle preference not found

**Route:** `DELETE /api/v1/ai/preferences/:context?`

**Estimated Time:** 1 hour

---

### 5.2 Preference Middleware
**File:** `src/middleware/AIGateway/preferences.ts`

**Tasks:**
- [ ] Create preference validation middleware
- [ ] Validate provider exists
- [ ] Validate model exists for provider
- [ ] Check model is currently available
- [ ] Return clear error messages

**Estimated Time:** 1.5 hours

---

### 5.3 Preference Routes
**File:** `src/routes/ai/index.ts`

**Tasks:**
- [ ] Add GET /preferences route
- [ ] Add PUT /preferences route
- [ ] Add DELETE /preferences route
- [ ] Apply authentication middleware
- [ ] Apply validation middleware

**Estimated Time:** 30 minutes

---

## 6. Models Listing API

### 6.1 Get Available Models Endpoint
**File:** `src/controllers/aiGateway.controller.ts`

**Tasks:**
- [ ] Implement `getAvailableModels()` controller
- [ ] Query all registered adapters
- [ ] Fetch provider information from database
- [ ] Include model capabilities
- [ ] Include pricing information
- [ ] Include performance metrics
- [ ] Calculate average latency from historical data
- [ ] Calculate success rate
- [ ] Mark recommended models
- [ ] Check current availability
- [ ] Format response per design spec

**Route:** `GET /api/v1/ai/models`

**Estimated Time:** 4 hours

---

### 6.2 Model Metadata Service
**File:** `src/services/AIGateway/core/ModelMetadata.ts`

**Tasks:**
- [ ] Create ModelMetadata service
- [ ] Load model configurations
- [ ] Store display names and descriptions
- [ ] Store capability information
- [ ] Store pricing data
- [ ] Provide model lookup methods
- [ ] Cache model metadata

**Estimated Time:** 2 hours

---

### 6.3 Models Route
**File:** `src/routes/ai/index.ts`

**Tasks:**
- [ ] Add GET /models route
- [ ] Apply optional authentication (public endpoint)
- [ ] Add caching headers
- [ ] Add rate limiting

**Estimated Time:** 30 minutes

---

## 7. Admin Management Endpoints

### 7.1 Provider Management

#### 7.1.1 List Providers
**Route:** `GET /api/v1/ai/admin/providers`

**Tasks:**
- [ ] Implement `listProviders()` controller
- [ ] Fetch all providers from database
- [ ] Include health status
- [ ] Include quota information
- [ ] Include usage statistics
- [ ] Require admin authentication

**Estimated Time:** 1.5 hours

---

#### 7.1.2 Update Provider Configuration
**Route:** `PATCH /api/v1/ai/admin/providers/:providerId`

**Tasks:**
- [ ] Implement `updateProvider()` controller
- [ ] Validate configuration updates
- [ ] Update provider in database
- [ ] Apply configuration to adapter
- [ ] Log configuration changes
- [ ] Require admin authentication

**Estimated Time:** 2 hours

---

#### 7.1.3 Enable/Disable Provider
**Route:** `POST /api/v1/ai/admin/providers/:providerId/toggle`

**Tasks:**
- [ ] Implement `toggleProvider()` controller
- [ ] Enable or disable provider
- [ ] Update adapter availability
- [ ] Log state change
- [ ] Require admin authentication

**Estimated Time:** 1 hour

---

### 7.2 Usage Analytics

#### 7.2.1 Get All Usage Statistics
**Route:** `GET /api/v1/ai/admin/usage`

**Tasks:**
- [ ] Implement admin usage endpoint
- [ ] Aggregate usage across all users
- [ ] Filter by date range
- [ ] Group by provider, model, user
- [ ] Include cost totals
- [ ] Include token totals
- [ ] Add pagination
- [ ] Require admin authentication

**Estimated Time:** 3 hours

---

#### 7.2.2 Get Cost Analytics
**Route:** `GET /api/v1/ai/admin/costs`

**Tasks:**
- [ ] Implement cost analytics endpoint
- [ ] Calculate costs by provider
- [ ] Calculate costs by user
- [ ] Calculate costs over time
- [ ] Include projections
- [ ] Export to CSV option
- [ ] Require admin authentication

**Estimated Time:** 2 hours

---

### 7.3 Quota Management

#### 7.3.1 Update User Quota
**Route:** `PUT /api/v1/ai/admin/quotas/:userId`

**Tasks:**
- [ ] Implement `updateUserQuota()` controller
- [ ] Validate quota values
- [ ] Update quota limits
- [ ] Support tier changes
- [ ] Log quota changes
- [ ] Require admin authentication

**Estimated Time:** 1.5 hours

---

#### 7.3.2 Reset User Quota
**Route:** `POST /api/v1/ai/admin/quotas/:userId/reset`

**Tasks:**
- [ ] Implement quota reset endpoint
- [ ] Reset daily/monthly counters
- [ ] Reset spend amounts
- [ ] Update reset timestamps
- [ ] Log reset action
- [ ] Require admin authentication

**Estimated Time:** 1 hour

---

### 7.4 Admin Routes
**File:** `src/routes/ai/admin.routes.ts`

**Tasks:**
- [ ] Create admin routes file
- [ ] Add provider management routes
- [ ] Add usage analytics routes
- [ ] Add quota management routes
- [ ] Apply admin authentication middleware
- [ ] Apply validation middleware

**Estimated Time:** 1 hour

---

## 8. Performance Optimization

### 8.1 Connection Pooling
**Tasks:**
- [ ] Implement HTTP agent pooling for adapters
- [ ] Configure keep-alive settings
- [ ] Set connection limits per provider
- [ ] Monitor connection pool metrics

**Estimated Time:** 2 hours

---

### 8.2 Request Timeout Optimization
**Tasks:**
- [ ] Configure aggressive timeouts per provider
- [ ] Add timeout configuration in env
- [ ] Implement timeout warning logs
- [ ] Test timeout behavior

**Estimated Time:** 1 hour

---

### 8.3 Parallel Health Checks
**Tasks:**
- [ ] Move health checks to background job
- [ ] Don't block on health checks
- [ ] Update health status asynchronously
- [ ] Cache health status with TTL

**Estimated Time:** 2 hours

---

### 8.4 Database Query Optimization
**Tasks:**
- [ ] Review and optimize quota queries
- [ ] Add composite indexes
- [ ] Optimize usage history queries
- [ ] Add query result caching (Redis)
- [ ] Use database connection pooling

**Estimated Time:** 3 hours

---

## 9. Enhanced Monitoring

### 9.1 Metrics Collection Service
**File:** `src/services/AIGateway/core/MetricsCollector.ts`

**Tasks:**
- [ ] Create MetricsCollector class
- [ ] Track total requests counter
- [ ] Track success/failure rates
- [ ] Track cache hit rates
- [ ] Track provider-specific metrics
- [ ] Track cost metrics
- [ ] Track token usage
- [ ] Calculate average latency
- [ ] Implement metrics export

**Estimated Time:** 4 hours

---

### 9.2 Provider Health Monitoring
**Tasks:**
- [ ] Create health check cron job (every 5 minutes)
- [ ] Check all provider health
- [ ] Store health history in database
- [ ] Update provider status
- [ ] Alert on consecutive failures
- [ ] Create health history endpoint

**Estimated Time:** 3 hours

---

### 9.3 Metrics Dashboard Endpoint
**Route:** `GET /api/v1/ai/metrics`

**Tasks:**
- [ ] Implement metrics endpoint
- [ ] Return gateway statistics
- [ ] Return provider breakdown
- [ ] Return cache statistics
- [ ] Return performance metrics
- [ ] Add admin authentication
- [ ] Format for visualization

**Estimated Time:** 2 hours

---

### 9.4 Structured Logging Enhancement
**Tasks:**
- [ ] Add structured logging for all operations
- [ ] Include request IDs for tracing
- [ ] Log routing decisions
- [ ] Log fallback attempts
- [ ] Log cache operations
- [ ] Log quota checks
- [ ] Configure log levels per environment

**Estimated Time:** 2 hours

---

## 10. Frontend Integration

### 10.1 Model Selector Component
**File:** `frontend/src/components/AI/ModelSelector.tsx`

**Tasks:**
- [ ] Create ModelSelector React component
- [ ] Fetch available models from API
- [ ] Display models in dropdown/list
- [ ] Show pricing information
- [ ] Show performance indicators
- [ ] Show health status (green/yellow/red)
- [ ] Mark recommended models
- [ ] Handle model selection
- [ ] Update user preference on backend
- [ ] Add loading and error states

**Estimated Time:** 4 hours

---

### 10.2 AI Service Layer
**File:** `frontend/src/services/ai.service.ts`

**Tasks:**
- [ ] Create AIService class
- [ ] Implement `getAvailableModels()`
- [ ] Implement `getUserPreferences()`
- [ ] Implement `updatePreference()`
- [ ] Implement `generate()` method
- [ ] Add error handling
- [ ] Add TypeScript types

**Estimated Time:** 2 hours

---

### 10.3 AI Settings Page
**File:** `frontend/src/pages/Settings/AISettings.tsx`

**Tasks:**
- [ ] Create AI Settings page
- [ ] Add default model selector
- [ ] Add context-specific model selectors (writing, dictionary)
- [ ] Show current preferences
- [ ] Display usage statistics
- [ ] Add save/reset buttons
- [ ] Add loading states

**Estimated Time:** 3 hours

---

### 10.4 Usage Statistics Component
**File:** `frontend/src/components/AI/UsageStats.tsx`

**Tasks:**
- [ ] Create UsageStats component
- [ ] Fetch usage data from API
- [ ] Display total requests
- [ ] Display total tokens
- [ ] Display total cost
- [ ] Display cache hit rate
- [ ] Show provider breakdown chart
- [ ] Add date range selector

**Estimated Time:** 3 hours

---

### 10.5 Integration with Existing Features

#### 10.5.1 Writing Studio Integration
**File:** `frontend/src/components/WritingStudio/*`

**Tasks:**
- [ ] Update text improvement to use AI Gateway
- [ ] Pass context parameter ('writing')
- [ ] Show model used in response
- [ ] Display token usage
- [ ] Add model selector in settings

**Estimated Time:** 2 hours

---

#### 10.5.2 Dictionary Integration
**File:** `frontend/src/components/Dictionary/*`

**Tasks:**
- [ ] Update word lookup to use AI Gateway
- [ ] Pass context parameter ('dictionary')
- [ ] Show model used
- [ ] Add model selector in dictionary settings

**Estimated Time:** 1.5 hours

---

## 11. Documentation & Testing

### 11.1 API Documentation
**File:** `backend/docs/AI_GATEWAY_API.md`

**Tasks:**
- [ ] Document all endpoints with examples
- [ ] Document request/response formats
- [ ] Document error codes
- [ ] Document authentication requirements
- [ ] Add cURL examples
- [ ] Add Postman collection

**Estimated Time:** 4 hours

---

### 11.2 Integration Guide
**File:** `backend/docs/AI_GATEWAY_INTEGRATION.md`

**Tasks:**
- [ ] Write integration guide for frontend
- [ ] Provide code examples
- [ ] Document common use cases
- [ ] Add troubleshooting section
- [ ] Migration guide from Gemini

**Estimated Time:** 3 hours

---

### 11.3 Unit Tests

**Tasks:**
- [ ] Write tests for DeepSeek adapter
- [ ] Write tests for HuggingFace adapter
- [ ] Write tests for ModelRouter
- [ ] Write tests for CircuitBreaker
- [ ] Write tests for AICache
- [ ] Write tests for preferences endpoints
- [ ] Write tests for models endpoint
- [ ] Achieve >80% code coverage

**Estimated Time:** 8 hours

---

### 11.4 Integration Tests

**Tasks:**
- [ ] Test multi-provider fallback
- [ ] Test routing policies
- [ ] Test circuit breaker behavior
- [ ] Test caching functionality
- [ ] Test preference management
- [ ] Test quota enforcement
- [ ] Test admin endpoints

**Estimated Time:** 6 hours

---

### 11.5 E2E Tests

**Tasks:**
- [ ] Test complete user workflow
- [ ] Test model selection flow
- [ ] Test preference updates
- [ ] Test usage tracking
- [ ] Test quota limits
- [ ] Test admin management

**Estimated Time:** 4 hours

---

### 11.6 Load Testing

**Tasks:**
- [ ] Create load test scenarios
- [ ] Test with 100 concurrent users
- [ ] Measure latency under load
- [ ] Test cache effectiveness
- [ ] Test provider failover under load
- [ ] Document performance benchmarks

**Estimated Time:** 4 hours

---

## Phase 2 Summary

### Total Estimated Time
- **Additional Adapters:** 11 hours
- **Routing & Orchestration:** 20 hours
- **Circuit Breaker:** 6 hours
- **Caching Layer:** 9.5 hours
- **User Preferences:** 9 hours
- **Models Listing:** 6.5 hours
- **Admin Endpoints:** 14 hours
- **Performance:** 8 hours
- **Monitoring:** 11 hours
- **Frontend:** 15.5 hours
- **Documentation & Testing:** 29 hours

**Total:** ~140 hours (~4-5 weeks for 1 developer)

---

## Success Criteria

### Technical Metrics
- ✅ At least 3 AI providers integrated and working
- ✅ Fallback success rate > 95%
- ✅ Cache hit rate > 40%
- ✅ P95 latency < 3 seconds
- ✅ Circuit breaker prevents cascading failures
- ✅ All tests passing with >80% coverage

### User Experience Metrics
- ✅ Users can select preferred models from UI
- ✅ Preferences persist across sessions
- ✅ Clear cost and performance information displayed
- ✅ Seamless fallback (users don't notice provider failures)

### Business Metrics
- ✅ 30-50% reduction in AI API costs
- ✅ No degradation in response quality
- ✅ 99.9% AI service availability

---

## Dependencies

### External Services
- Redis (for caching)
- PostgreSQL (for quota and usage tracking)
- Provider API keys (OpenAI, DeepSeek, HuggingFace)

### Configuration
- Environment variables for all providers
- Redis connection configuration
- Cache TTL settings
- Circuit breaker thresholds

---

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Provider API changes | Version adapters, monitor changelogs |
| Cache invalidation issues | Implement robust invalidation logic, add manual override |
| Circuit breaker false positives | Tunable thresholds, monitoring, manual reset |
| Performance degradation | Load testing, caching, connection pooling |
| Cost overruns | Strict quotas, alerts, cost monitoring |

---

## Post-Phase 2 (Future Enhancements)

### Streaming Support
- Real-time token streaming for better UX
- WebSocket or SSE implementation

### Advanced Features
- Function calling support
- Embeddings API
- Fine-tuned model support
- Multi-modal capabilities (images)

### ML-Based Optimization
- ML-based provider selection
- A/B testing framework
- Quality scoring and optimization

---

**Document Owner:** Development Team
**Next Steps:** Review and approve Phase 2 plan, then begin implementation
**Priority:** High - Enables cost optimization and resilience
