/**
 * AI Gateway Type Definitions
 * 
 * Core types and interfaces for the Multi-Model AI Gateway Service
 */

/**
 * Routing policy options for provider selection
 */
export type RoutingPolicy =
  | 'user-preference'    // Use user's selected model (default when user specifies)
  | 'cost-optimized'     // Prefer cheapest provider
  | 'performance'        // Prefer fastest provider
  | 'quality'            // Prefer best quality model
  | 'round-robin'        // Distribute load evenly
  | 'fallback-chain';    // Try providers in order

/**
 * Model capabilities descriptor
 */
export interface ModelCapabilities {
  /** Maximum tokens the model can handle */
  maxTokens: number;
  
  /** Whether the model supports streaming responses */
  supportsStreaming: boolean;
  
  /** Whether the model supports system prompts */
  supportsSystemPrompt: boolean;
  
  /** Whether the model supports function calling */
  supportsFunctions: boolean;
}

/**
 * Health status of a provider
 */
export interface HealthStatus {
  /** Whether the provider is healthy */
  healthy: boolean;
  
  /** Average latency in milliseconds */
  latency?: number;
  
  /** Error rate (0-1) */
  errorRate?: number;
  
  /** Last time health was checked */
  lastChecked: Date;
  
  /** Optional message (e.g., error details) */
  message?: string;
}

/**
 * Quota status for a provider or user
 */
export interface QuotaStatus {
  /** Remaining quota */
  remaining: number;
  
  /** Total quota limit */
  limit: number;
  
  /** When the quota resets */
  resetAt: Date;
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  /** Requests allowed per minute */
  requestsPerMinute: number;
  
  /** Requests allowed per day */
  requestsPerDay: number;
}

/**
 * Cost estimate breakdown
 */
export interface CostEstimate {
  /** Total cost amount */
  amount: number;
  
  /** Currency code (e.g., "USD") */
  currency: string;
  
  /** Cost breakdown by component */
  breakdown: {
    promptCost: number;
    completionCost: number;
  };
}

/**
 * Options for text generation
 */
export interface GenerateOptions {
  /** Maximum tokens to generate (default: 1000) */
  maxTokens?: number;
  
  /** Creativity level 0-2 (default: 0.7) */
  temperature?: number;
  
  /** Nucleus sampling (default: 1.0) */
  topP?: number;
  
  /** Stop generation at these sequences */
  stopSequences?: string[];
  
  /** System message for chat models */
  systemPrompt?: string;
}

/**
 * Request payload for AI generation
 */
export interface GenerateRequest {
  /** The text prompt to generate from */
  prompt: string;
  
  /** Specific model to use (e.g., "gpt-4", "deepseek-chat") */
  model?: string;
  
  /** Specific provider to use (e.g., "openai", "deepseek") */
  provider?: string;
  
  /** Use user's saved preference (default: true) */
  useUserPreference?: boolean;
  
  /** Override default routing policy */
  routingPolicy?: RoutingPolicy;
  
  /** Generation options */
  options?: GenerateOptions;
  
  /** Use cached responses (default: true) */
  useCache?: boolean;
  
  /** Allow fallback to other providers (default: true) */
  allowFallback?: boolean;
  
  /** Max wait time in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Token usage statistics
 */
export interface TokenUsage {
  /** Number of tokens in the prompt */
  promptTokens: number;
  
  /** Number of tokens in the completion */
  completionTokens: number;
  
  /** Total tokens used */
  totalTokens: number;
}

/**
 * Successful generation response
 */
export interface GenerateResponse {
  /** Whether the request was successful */
  success: boolean;
  
  /** Response data */
  data: {
    /** Generated text output */
    output: string;
    
    /** Provider that was used */
    provider: string;
    
    /** Model that was used */
    model: string;
    
    /** Whether this response was from cache */
    cached: boolean;
    
    /** Token usage statistics */
    usage: TokenUsage;
    
    /** Response time in milliseconds */
    latency: number;
    
    /** Cost estimate for this request */
    costEstimate: CostEstimate;
    
    /** Optional warnings */
    warnings?: string[];
  };
  
  /** ISO timestamp of the response */
  timestamp: string;
}

/**
 * Result from a generation operation (internal format)
 */
export interface GenerateResult {
  /** Provider name */
  provider: string;
  
  /** Model ID */
  model: string;
  
  /** Generated output text */
  output: string;
  
  /** Token usage */
  usage: TokenUsage;
  
  /** Latency in milliseconds */
  latency: number | null;
  
  /** Whether from cache */
  cached: boolean;
  
  /** Cost estimate */
  costEstimate: CostEstimate;
  
  /** Raw provider response (for debugging) */
  raw?: any;
}

/**
 * Error response format
 */
export interface ErrorResponse {
  /** Always false for errors */
  success: false;
  
  /** Error details */
  error: {
    /** Error code (e.g., "QUOTA_EXCEEDED") */
    code: string;
    
    /** Human-readable error message */
    message: string;
    
    /** Provider that failed (if applicable) */
    provider?: string;
    
    /** Additional error details */
    details?: any;
  };
  
  /** ISO timestamp of the error */
  timestamp: string;
}

/**
 * Gateway metrics snapshot
 */
export interface GatewayMetrics {
  /** Total requests processed */
  totalRequests: number;
  
  /** Successful requests */
  successfulRequests: number;
  
  /** Failed requests */
  failedRequests: number;
  
  /** Cached requests */
  cachedRequests: number;
  
  /** Cache hit rate (0-1) */
  cacheHitRate: number;
  
  /** Total cost incurred */
  totalCost: number;
  
  /** Total tokens used */
  totalTokens: number;
}

// Re-export ModelAdapter from adapter.ts for convenience
export type { ModelAdapter } from './adapter';
