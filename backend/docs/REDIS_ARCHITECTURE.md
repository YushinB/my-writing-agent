# Redis Caching Architecture - ProsePolish Backend

## Overview

Redis serves as a high-performance in-memory cache layer for the ProsePolish backend, providing:
- Sub-millisecond response times
- Reduced database load
- Cost savings on external API calls
- Scalable session management
- Distributed rate limiting

---

## Cache Layers Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT REQUEST                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: REDIS CACHE (In-Memory)                               │
│  ⚡ Response Time: 1-5ms                                         │
│  📦 Storage: Temporary (TTL-based)                               │
│  🎯 Hit Rate Target: >90%                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (cache miss)
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2: POSTGRESQL (Persistent)                               │
│  🚀 Response Time: 10-20ms                                       │
│  📦 Storage: Permanent                                           │
│  🎯 Hit Rate Target: >70%                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (cache miss)
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3: EXTERNAL APIS (Free Dictionary API)                   │
│  🌐 Response Time: 200-500ms                                     │
│  📦 Storage: None (fetched on-demand)                            │
│  💰 Cost: Free                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (API fail/404)
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4: GEMINI AI (LLM Fallback)                              │
│  🤖 Response Time: 1-2 seconds                                   │
│  📦 Storage: None (generated on-demand)                          │
│  💰 Cost: $0.0001-0.001 per request                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Redis Data Structure

### Cache Key Naming Convention

```
<prefix>:<identifier>[:<sub-key>]
```

### Key Prefixes

| Prefix | Purpose | TTL | Size Estimate |
|--------|---------|-----|---------------|
| `dict:` | Dictionary word definitions | 1 hour | ~500 bytes |
| `user:` | User profile data | 15 min | ~1 KB |
| `session:` | JWT refresh tokens | 7 days | ~200 bytes |
| `ratelimit:` | Rate limiting counters | 1-15 min | ~50 bytes |
| `llm:` | Cached LLM responses | 24 hours | ~2-5 KB |
| `settings:` | User settings | 1 hour | ~200 bytes |

### Example Keys

```
dict:eloquent                          # Dictionary entry for "eloquent"
user:550e8400-e29b-41d4-a716-446655440000  # User profile
session:eyJhbGciOiJIUzI1NiIsInR5cCI...   # Session token
ratelimit:user:123:llm                 # User's LLM rate limit counter
llm:correct:a8f5f167f44f4964e6c998dee827110c  # Cached correction
settings:user-123                      # User settings
```

---

## Cache TTL Strategy

### Short-Lived (Minutes)

**User Data:** 15 minutes
```typescript
await redis.setex('user:123', 900, JSON.stringify(userData));
```
- Balances freshness with performance
- Invalidated on profile updates

**Rate Limiting:** 1-15 minutes
```typescript
await redis.incr('ratelimit:user:123:llm');
await redis.expire('ratelimit:user:123:llm', 60);
```
- Auto-expires after window
- No manual cleanup needed

### Medium-Lived (Hours)

**Dictionary Cache:** 1 hour
```typescript
await redis.setex('dict:example', 3600, JSON.stringify(definition));
```
- Frequently accessed words stay hot
- Reduces PostgreSQL load

**User Settings:** 1 hour
```typescript
await redis.setex('settings:user-123', 3600, JSON.stringify(settings));
```
- Low change frequency
- Quick access for every request

**LLM Responses:** 24 hours
```typescript
await redis.setex('llm:correct:hash', 86400, JSON.stringify(result));
```
- Significant cost savings
- Same text → same correction

### Long-Lived (Days)

**Sessions:** 7 days
```typescript
await redis.setex('session:token', 604800, JSON.stringify(sessionData));
```
- Matches JWT refresh token lifetime
- Auto-cleanup on expiration

---

## Memory Management

### Memory Estimates (1,000 Active Users)

| Data Type | Keys | Avg Size | Total Memory |
|-----------|------|----------|--------------|
| Dictionary | 5,000 | 500 bytes | 2.5 MB |
| Users | 1,000 | 1 KB | 1 MB |
| Sessions | 1,500 | 200 bytes | 300 KB |
| Settings | 1,000 | 200 bytes | 200 KB |
| LLM Cache | 2,000 | 3 KB | 6 MB |
| Rate Limits | 3,000 | 50 bytes | 150 KB |
| **Total** | **13,500** | - | **~10 MB** |

### Eviction Policy

```
maxmemory-policy allkeys-lru
```

- **LRU (Least Recently Used):** Evicts oldest unused keys
- **Threshold:** 80% of max memory
- **Max Memory:** 256 MB (default), 1 GB (production)

### Monitoring Memory

```typescript
const memory = await redis.info('memory');
console.log('Used memory:', parseMemory(memory, 'used_memory_human'));
console.log('Peak memory:', parseMemory(memory, 'used_memory_peak_human'));
console.log('Fragmentation ratio:', parseMemory(memory, 'mem_fragmentation_ratio'));
```

---

## Cache Invalidation Strategies

### 1. Time-Based (TTL)

Automatic expiration - most common approach.

```typescript
// Dictionary: 1 hour
await redis.setex('dict:word', 3600, data);

// LLM: 24 hours
await redis.setex('llm:hash', 86400, data);
```

### 2. Event-Based (Manual)

Invalidate on data changes.

```typescript
// User updates profile
async function updateUserProfile(userId: string, updates: any) {
  await db.user.update({ where: { id: userId }, data: updates });

  // Invalidate cache
  await redis.del(`user:${userId}`);
  await redis.del(`settings:${userId}`);
}

// Admin refreshes dictionary entry
async function refreshDictionaryEntry(word: string) {
  await redis.del(`dict:${word.toLowerCase()}`);
  await db.dictionaryEntry.delete({ where: { word } });
}
```

### 3. Pattern-Based (Bulk Deletion)

Delete multiple keys matching a pattern.

```typescript
// Logout all user sessions
async function logoutAllSessions(userId: string) {
  const sessions = await redis.smembers(`user:${userId}:sessions`);

  const pipeline = redis.pipeline();
  sessions.forEach(token => {
    pipeline.del(`session:${token}`);
  });
  pipeline.del(`user:${userId}:sessions`);

  await pipeline.exec();
}

// Clear all LLM cache
async function clearLLMCache() {
  const keys = await redis.keys('llm:*');
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

---

## Performance Optimization

### 1. Pipeline Commands

Batch multiple commands into one network round-trip.

```typescript
const pipeline = redis.pipeline();
pipeline.get('dict:word1');
pipeline.get('dict:word2');
pipeline.get('dict:word3');

const results = await pipeline.exec();
```

**Benefit:** 3x faster than sequential commands

### 2. Lua Scripts (Atomic Operations)

Execute complex operations atomically.

```typescript
const checkAndIncrLua = `
  local current = redis.call('GET', KEYS[1])
  if not current or tonumber(current) < tonumber(ARGV[1]) then
    redis.call('INCR', KEYS[1])
    redis.call('EXPIRE', KEYS[1], ARGV[2])
    return 1
  end
  return 0
`;

const allowed = await redis.eval(
  checkAndIncrLua,
  1,
  'ratelimit:user:123',
  '10',  // max requests
  '60'   // window seconds
);
```

**Benefit:** Race-condition free, atomic execution

### 3. Lazy Connect

Don't block startup on Redis connection.

```typescript
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  lazyConnect: true,  // Don't connect immediately
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

// Connect asynchronously
redis.connect().catch(console.error);
```

**Benefit:** Faster server startup, graceful degradation

---

## High Availability

### 1. Connection Retry Strategy

```typescript
const redis = new Redis({
  retryStrategy: (times) => {
    if (times > 10) {
      return null; // Stop retrying
    }
    return Math.min(times * 50, 2000); // Exponential backoff
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true; // Reconnect on this error
    }
    return false;
  }
});
```

### 2. Graceful Degradation

Always have a fallback when Redis is unavailable.

```typescript
async function getCachedData(key: string, fallback: () => Promise<any>) {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  } catch (error) {
    console.error('Redis error:', error);
    // Continue to fallback
  }

  // Fallback to database/API
  return await fallback();
}
```

### 3. Health Checks

Monitor Redis connectivity.

```typescript
async function checkRedisHealth() {
  try {
    await redis.ping();
    return { status: 'healthy', latency: await measureLatency() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

async function measureLatency() {
  const start = Date.now();
  await redis.ping();
  return Date.now() - start;
}
```

---

## Production Deployment

### Docker Compose Setup

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: prosepolish-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  redis-data:
```

### Redis Configuration (`redis.conf`)

```conf
# Memory
maxmemory 1gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1      # Save after 900 sec if 1 key changed
save 300 10     # Save after 300 sec if 10 keys changed
save 60 10000   # Save after 60 sec if 10000 keys changed

# Security
requirepass your-strong-password-here
bind 0.0.0.0
protected-mode yes

# Performance
tcp-backlog 511
timeout 300
tcp-keepalive 60

# Logging
loglevel notice
logfile /var/log/redis/redis.log
```

### Environment Variables

```env
REDIS_HOST=redis  # Docker service name or IP
REDIS_PORT=6379
REDIS_PASSWORD=your-strong-password-here
REDIS_DB=0
REDIS_TLS_ENABLED=false  # true for production with TLS
```

---

## Monitoring & Alerts

### Key Metrics

```typescript
async function getRedisMetrics() {
  const info = await redis.info();

  return {
    // Memory
    usedMemory: parseInfo(info, 'used_memory_human'),
    memoryFragmentation: parseInfo(info, 'mem_fragmentation_ratio'),

    // Performance
    hitRate: calculateHitRate(
      parseInfo(info, 'keyspace_hits'),
      parseInfo(info, 'keyspace_misses')
    ),
    opsPerSec: parseInfo(info, 'instantaneous_ops_per_sec'),

    // Connections
    connectedClients: parseInfo(info, 'connected_clients'),

    // Persistence
    lastSaveTime: parseInfo(info, 'rdb_last_save_time'),
    changesSinceLastSave: parseInfo(info, 'rdb_changes_since_last_save')
  };
}

function calculateHitRate(hits: number, misses: number): number {
  const total = hits + misses;
  return total > 0 ? (hits / total) * 100 : 0;
}
```

### Alert Thresholds

- **Memory Usage:** > 80% → Scale up or increase eviction
- **Hit Rate:** < 85% → Review cache strategy
- **Connection Errors:** > 5/min → Check network/config
- **Latency:** > 10ms avg → Investigate performance

---

## Cost Savings Analysis

### LLM Caching Impact

**Assumptions:**
- 1,000 correction requests/day
- 30% cache hit rate
- Average cost: $0.0005 per request

**Monthly Savings:**
```
Cached requests: 1,000 × 30 × 0.30 = 9,000 requests
Savings: 9,000 × $0.0005 = $4.50/month
```

**Annual Savings:** $54/year per 1,000 daily requests

### Dictionary API Bandwidth

**Assumptions:**
- 5,000 dictionary lookups/day
- 90% Redis hit rate
- Average API response: 2 KB

**Bandwidth Saved:**
```
Cached requests: 5,000 × 30 × 0.90 = 135,000 requests
Bandwidth: 135,000 × 2 KB = 270 MB/month
```

---

## Best Practices

### ✅ Do

1. **Always set TTL** - Prevent memory leaks
2. **Use pipelines** - Batch related commands
3. **Monitor hit rates** - Optimize cache strategy
4. **Implement fallbacks** - Graceful degradation
5. **Use connection pooling** - Reuse connections
6. **Namespace keys** - Use consistent prefixes
7. **Handle errors** - Don't crash on Redis failures

### ❌ Don't

1. **Store large objects** - Keep values < 10 KB
2. **Use blocking commands** - `BLPOP`, `BRPOP` in HTTP context
3. **Store sensitive data unencrypted** - Use encryption at rest
4. **Ignore memory limits** - Set `maxmemory`
5. **Skip TTL on temporary data** - Always expire cache
6. **Use `KEYS` in production** - Use `SCAN` instead
7. **Forget to test failover** - Simulate Redis downtime

---

**Last Updated:** 2024-11-30
**Version:** 1.0
