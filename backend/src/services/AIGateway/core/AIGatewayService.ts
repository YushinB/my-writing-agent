import type {
  ModelAdapter,
  GenerateRequest,
  GenerateResponse,
  GenerateResult,
  HealthStatus,
  RoutingPolicy,
} from '../types';
import { usageTracker } from './UsageTracker';

/**
 * AIGatewayService
 *
 * Core service that manages AI model adapters, routes requests to appropriate providers,
 * and provides a unified interface for AI text generation.
 *
 * This service implements the singleton pattern to ensure only one instance exists
 * throughout the application lifecycle.
 */
export class AIGatewayService {
  private static instance: AIGatewayService | null = null;
  private adapters: Map<string, ModelAdapter> = new Map();
  private defaultProvider: string | null = null;
  private requestTimeout: number = 30000; // 30 seconds default

  /**
   * Private constructor to enforce singleton pattern.
   * Use AIGatewayService.getInstance() instead.
   */
  private constructor() {
    // Private to prevent direct instantiation
  }

  /**
   * Get the singleton instance of AIGatewayService.
   * Creates the instance if it doesn't exist.
   *
   * @returns The singleton AIGatewayService instance
   */
  public static getInstance(): AIGatewayService {
    if (!AIGatewayService.instance) {
      AIGatewayService.instance = new AIGatewayService();
    }
    return AIGatewayService.instance;
  }

  /**
   * Register a model adapter with the gateway.
   *
   * @param adapter - The ModelAdapter instance to register
   * @param isDefault - Whether this should be the default provider
   *
   * @example
   * ```typescript
   * const openaiAdapter = new OpenAIAdapter(apiKey, 'gpt-4');
   * gateway.registerAdapter(openaiAdapter, true);
   * ```
   */
  public registerAdapter(adapter: ModelAdapter, isDefault: boolean = false): void {
    const key = `${adapter.providerName}:${adapter.modelId}`;
    this.adapters.set(key, adapter);

    // Also register by provider name only for easy lookup
    this.adapters.set(adapter.providerName, adapter);

    if (isDefault || this.defaultProvider === null) {
      this.defaultProvider = adapter.providerName;
    }

    this.log('info', `Registered adapter: ${key}${isDefault ? ' (default)' : ''}`);
  }

  /**
   * Set the default request timeout for all generation requests.
   *
   * @param timeoutMs - Timeout in milliseconds
   */
  public setRequestTimeout(timeoutMs: number): void {
    this.requestTimeout = timeoutMs;
    this.log('info', `Request timeout set to ${timeoutMs}ms`);
  }

  /**
   * Generate text using the AI gateway.
   *
   * Routes the request to the appropriate provider based on the request parameters
   * and configured routing policy. Handles timeouts, errors, and response formatting.
   *
   * @param request - The generation request
   * @param userId - Optional user ID for tracking and quota management
   * @returns A promise that resolves to a formatted GenerateResponse
   * @throws Error if generation fails or times out
   *
   * @example
   * ```typescript
   * const response = await gateway.generate({
   *   prompt: "Write a poem about AI",
   *   options: { maxTokens: 100 }
   * });
   * console.log(response.data.output);
   * ```
   */
  public async generate(
    request: GenerateRequest,
    userId?: string
  ): Promise<GenerateResponse> {
    const startTime = Date.now();

    try {
      // Log the incoming request
      this.log('info', `Generation request received`, {
        provider: request.provider,
        model: request.model,
        promptLength: request.prompt?.length || 0,
        userId,
      });

      // Select the appropriate adapter
      const adapter = this.selectAdapter(request);

      if (!adapter) {
        throw new Error('No suitable adapter found for the request');
      }

      this.log('info', `Routing to adapter: ${adapter.providerName}:${adapter.modelId}`);

      // Execute the generation with timeout
      const timeout = request.timeout ?? this.requestTimeout;
      const result = await this.executeWithTimeout(
        () => adapter.generate(request),
        timeout,
        `Generation request timed out after ${timeout}ms`
      );

      // Calculate actual latency
      const latency = Date.now() - startTime;

      // Track successful usage (non-blocking)
      if (userId) {
        usageTracker.recordSuccess(userId, request, result, latency).catch((err) => {
          this.log('warn', 'Usage tracking failed (non-blocking)', { error: err.message });
        });
      }

      // Format and return the response
      const response = this.formatSuccessResponse(result, latency);

      this.log('info', `Generation completed successfully`, {
        provider: result.provider,
        model: result.model,
        latency,
        tokens: result.usage.totalTokens,
        cost: result.costEstimate.amount,
      });

      return response;

    } catch (error) {
      const latency = Date.now() - startTime;

      // Track failed usage (non-blocking)
      if (userId && adapter) {
        const errorCode = this.getErrorCode(error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        usageTracker
          .recordFailure(userId, request, adapter.providerName, adapter.modelId, {
            code: errorCode,
            message: errorMessage,
          }, latency)
          .catch((err) => {
            this.log('warn', 'Failed usage tracking failed (non-blocking)', { error: err.message });
          });
      }

      this.log('error', `Generation failed`, {
        error: error instanceof Error ? error.message : String(error),
        latency,
      });

      throw this.wrapError(error);
    }
  }

  /**
   * Check health status of all registered providers.
   *
   * @returns A promise that resolves to a map of provider health statuses
   *
   * @example
   * ```typescript
   * const health = await gateway.health();
   * for (const [provider, status] of Object.entries(health)) {
   *   console.log(`${provider}: ${status.healthy ? 'UP' : 'DOWN'}`);
   * }
   * ```
   */
  public async health(): Promise<Record<string, HealthStatus>> {
    this.log('info', 'Health check initiated');

    const healthStatuses: Record<string, HealthStatus> = {};

    // Get unique providers (avoid checking duplicates)
    const uniqueProviders = new Map<string, ModelAdapter>();
    for (const [key, adapter] of this.adapters.entries()) {
      if (key === adapter.providerName) {
        uniqueProviders.set(adapter.providerName, adapter);
      }
    }

    // Check health of each unique provider
    const healthChecks = Array.from(uniqueProviders.entries()).map(
      async ([providerName, adapter]) => {
        try {
          const status = await this.executeWithTimeout(
            () => adapter.health(),
            5000, // 5 second timeout for health checks
            'Health check timed out'
          );
          healthStatuses[providerName] = status;

          this.log('info', `Health check: ${providerName}`, {
            healthy: status.healthy,
            latency: status.latency,
          });
        } catch (error) {
          healthStatuses[providerName] = {
            healthy: false,
            lastChecked: new Date(),
            message: error instanceof Error ? error.message : 'Health check failed',
          };

          this.log('warn', `Health check failed: ${providerName}`, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    );

    await Promise.all(healthChecks);

    return healthStatuses;
  }

  /**
   * Get a list of all registered providers and their models.
   *
   * @returns Array of registered provider information
   */
  public getRegisteredProviders(): Array<{
    provider: string;
    model: string;
    isDefault: boolean;
  }> {
    const providers: Array<{ provider: string; model: string; isDefault: boolean }> = [];

    for (const [key, adapter] of this.adapters.entries()) {
      // Only return full key entries (provider:model)
      if (key.includes(':')) {
        providers.push({
          provider: adapter.providerName,
          model: adapter.modelId,
          isDefault: adapter.providerName === this.defaultProvider,
        });
      }
    }

    return providers;
  }

  // --- Private Helper Methods ---

  /**
   * Select the appropriate adapter based on the request and routing policy.
   *
   * For Phase 1, this is simplified to select based on:
   * 1. Explicit provider/model in request
   * 2. Default provider
   */
  private selectAdapter(request: GenerateRequest): ModelAdapter | null {
    // If specific provider and model requested
    if (request.provider && request.model) {
      const key = `${request.provider}:${request.model}`;
      if (this.adapters.has(key)) {
        return this.adapters.get(key)!;
      }
    }

    // If only provider requested, use any model from that provider
    if (request.provider) {
      if (this.adapters.has(request.provider)) {
        return this.adapters.get(request.provider)!;
      }
    }

    // If only model requested, search across providers
    if (request.model) {
      for (const adapter of this.adapters.values()) {
        if (adapter.modelId === request.model) {
          return adapter;
        }
      }
    }

    // Fall back to default provider
    if (this.defaultProvider && this.adapters.has(this.defaultProvider)) {
      return this.adapters.get(this.defaultProvider)!;
    }

    return null;
  }

  /**
   * Execute a promise with a timeout.
   *
   * @param fn - Function that returns a promise
   * @param timeoutMs - Timeout in milliseconds
   * @param timeoutMessage - Error message for timeout
   * @returns Promise result or throws timeout error
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      ),
    ]);
  }

  /**
   * Format a successful generation result into a standardized response.
   */
  private formatSuccessResponse(
    result: GenerateResult,
    latency: number
  ): GenerateResponse {
    return {
      success: true,
      data: {
        output: result.output,
        provider: result.provider,
        model: result.model,
        cached: result.cached,
        usage: result.usage,
        latency,
        costEstimate: result.costEstimate,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Wrap and standardize errors from adapters and internal operations.
   */
  private wrapError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    return new Error(`AI Gateway error: ${String(error)}`);
  }

  /**
   * Get error code from error object
   */
  private getErrorCode(error: unknown): string {
    if (error instanceof Error) {
      // Check for common error patterns
      if (error.message.includes('timeout')) return 'TIMEOUT';
      if (error.message.includes('quota')) return 'QUOTA_EXCEEDED';
      if (error.message.includes('unauthorized') || error.message.includes('401')) return 'UNAUTHORIZED';
      if (error.message.includes('rate limit') || error.message.includes('429')) return 'RATE_LIMIT';
      if (error.message.includes('no suitable adapter')) return 'NO_ADAPTER';
    }
    return 'UNKNOWN_ERROR';
  }

  /**
   * Internal logging utility.
   *
   * @param level - Log level (info, warn, error)
   * @param message - Log message
   * @param metadata - Optional metadata object
   */
  private log(
    level: 'info' | 'warn' | 'error',
    message: string,
    metadata?: Record<string, any>
  ): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: 'AIGateway',
      message,
      ...metadata,
    };

    // In production, this would use a proper logger (Winston, Pino, etc.)
    // For now, use console
    if (level === 'error') {
      console.error('[AIGateway]', message, metadata || '');
    } else if (level === 'warn') {
      console.warn('[AIGateway]', message, metadata || '');
    } else {
      console.log('[AIGateway]', message, metadata || '');
    }
  }
}

export default AIGatewayService;
