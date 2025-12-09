/**
 * AI Gateway Service Instance
 *
 * Initializes and exports the configured AIGatewayService singleton.
 * Registers all available AI provider adapters based on environment configuration.
 */

import { AIGatewayService } from './core/AIGatewayService';
import { OpenAIAdapter } from './adapters/OpenAIAdapter';
import { env } from '../../config/env';

/**
 * Initialize the AI Gateway Service and register adapters.
 *
 * This function sets up the gateway with all configured providers.
 * It runs once when the module is first imported.
 */
function initializeAIGateway(): AIGatewayService {
  // Get the singleton instance
  const gateway = AIGatewayService.getInstance();

  // Configure request timeout from environment
  if (env.AI_GATEWAY_REQUEST_TIMEOUT) {
    gateway.setRequestTimeout(env.AI_GATEWAY_REQUEST_TIMEOUT);
  }

  // Register OpenAI adapter if API key is available
  if (env.OPENAI_API_KEY) {
    try {
      const openaiAdapter = new OpenAIAdapter(
        env.OPENAI_API_KEY,
        env.OPENAI_MODEL || 'gpt-3.5-turbo'
      );

      // Register as the default provider for Phase 1
      gateway.registerAdapter(openaiAdapter, true);

      console.log('✅ AI Gateway: OpenAI adapter registered successfully');
      console.log(`   Model: ${env.OPENAI_MODEL || 'gpt-3.5-turbo'}`);
    } catch (error) {
      console.error('❌ AI Gateway: Failed to register OpenAI adapter', error);
      // Don't throw - allow the app to continue without AI Gateway
      // The service will return appropriate errors when called
    }
  } else {
    console.warn('⚠️  AI Gateway: OPENAI_API_KEY not found in environment');
    console.warn('   AI Gateway will not be available until configured');
  }

  // Future: Register other providers (DeepSeek, Hugging Face, etc.)
  // if (env.DEEPSEEK_API_KEY) { ... }
  // if (env.HUGGINGFACE_API_KEY) { ... }

  return gateway;
}

/**
 * Configured AI Gateway Service instance.
 *
 * This is the main export that should be used throughout the application.
 *
 * @example
 * ```typescript
 * import { aiGateway } from '@/services/AIGateway';
 *
 * const response = await aiGateway.generate({
 *   prompt: "Explain TypeScript generics",
 *   options: { maxTokens: 500 }
 * });
 *
 * console.log(response.data.output);
 * ```
 */
export const aiGateway = initializeAIGateway();

/**
 * Re-export types for convenience
 */
export type {
  GenerateRequest,
  GenerateResponse,
  GenerateOptions,
  HealthStatus,
  ModelAdapter,
  RoutingPolicy,
  TokenUsage,
  CostEstimate,
} from './types';

/**
 * Re-export the service class for testing/advanced usage
 */
export { AIGatewayService } from './core/AIGatewayService';

/**
 * Re-export adapters for manual initialization if needed
 */
export { OpenAIAdapter } from './adapters/OpenAIAdapter';

/**
 * Default export is the configured gateway instance
 */
export default aiGateway;
