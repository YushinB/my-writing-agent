import type {
  ModelCapabilities,
  HealthStatus,
  QuotaStatus,
  RateLimitInfo,
  CostEstimate,
  GenerateRequest,
  GenerateResult,
} from './index';

/**
 * ModelAdapter Interface
 * 
 * Defines the contract that all AI provider adapters must implement.
 * This interface abstracts provider-specific details and provides a unified API
 * for the AI Gateway to interact with different AI services.
 */
export interface ModelAdapter {
  // Metadata
  /** Provider name (e.g., "openai", "deepseek", "huggingface") */
  providerName: string;
  
  /** Model identifier (e.g., "gpt-4", "deepseek-chat") */
  modelId: string;
  
  /** Model capabilities and feature support */
  capabilities: ModelCapabilities;

  /**
   * Generate content based on the provided request.
   * 
   * This is the primary method for text generation. It accepts a complete
   * GenerateRequest object that includes the prompt, options, and metadata.
   * 
   * @param request - The generation request containing prompt and options
   * @returns A promise that resolves to a GenerateResult with output and usage metrics
   * @throws Error if generation fails or provider is unavailable
   * 
   * @example
   * ```typescript
   * const result = await adapter.generate({
   *   prompt: "Write a haiku about coding",
   *   options: { maxTokens: 100, temperature: 0.7 }
   * });
   * console.log(result.output);
   * ```
   */
  generate(request: GenerateRequest): Promise<GenerateResult>;

  /**
   * Check the health status of the model/provider.
   * 
   * Performs a lightweight check to verify that the provider API is accessible
   * and responding. This is used by the circuit breaker and health monitoring systems.
   * 
   * @returns A promise that resolves to a HealthStatus object
   * 
   * @example
   * ```typescript
   * const status = await adapter.health();
   * if (status.healthy) {
   *   console.log(`Provider is healthy with ${status.latency}ms latency`);
   * }
   * ```
   */
  health(): Promise<HealthStatus>;

  /**
   * Estimate the cost of a generation request.
   * 
   * Calculates the expected cost based on token counts and provider pricing.
   * This is used for cost-based routing and budget tracking.
   * 
   * @param request - The generation request to estimate cost for
   * @returns A promise that resolves to a CostEstimate object
   * 
   * @example
   * ```typescript
   * const estimate = await adapter.estimateCost({
   *   prompt: "Long prompt...",
   *   options: { maxTokens: 1000 }
   * });
   * console.log(`Estimated cost: $${estimate.amount}`);
   * ```
   */
  estimateCost(request: GenerateRequest): Promise<CostEstimate>;

  /**
   * Check the quota status for the provider.
   * 
   * Returns information about remaining API quota/rate limits.
   * Some providers may return Infinity for unlimited quotas.
   * 
   * @returns A promise that resolves to a QuotaStatus object
   * 
   * @example
   * ```typescript
   * const quota = await adapter.checkQuota();
   * console.log(`${quota.remaining}/${quota.limit} requests remaining`);
   * ```
   */
  checkQuota(): Promise<QuotaStatus>;

  /**
   * Get the current rate limit information for this provider.
   * 
   * Returns static rate limit configuration that defines how many requests
   * can be made per time period.
   * 
   * @returns A RateLimitInfo object with rate limit details
   * 
   * @example
   * ```typescript
   * const limits = adapter.getRateLimit();
   * console.log(`Rate limit: ${limits.requestsPerMinute} req/min`);
   * ```
   */
  getRateLimit(): RateLimitInfo;
}
