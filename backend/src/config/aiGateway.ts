import { env } from './env';

/**
 * AI Gateway Configuration
 *
 * Centralized configuration for the AI Gateway service.
 * Loads settings from environment variables with type-safe defaults.
 */

/**
 * OpenAI Configuration
 */
export interface OpenAIConfig {
  apiKey?: string;
  model: string;
  maxTokens: number;
  enabled: boolean;
}

/**
 * General AI Gateway Configuration
 */
export interface AIGatewayConfig {
  requestTimeout: number;
  maxRetries: number;
  enableCaching: boolean;
  enableFallback: boolean;
}

/**
 * Default Quota Configuration
 */
export interface QuotaConfig {
  dailyLimit: number;
  monthlyLimit: number;
  monthlySpendLimit: number;
  defaultTier: string;
}

/**
 * Complete AI Gateway Configuration
 */
export interface AIGatewayFullConfig {
  openai: OpenAIConfig;
  gateway: AIGatewayConfig;
  quota: QuotaConfig;
}

/**
 * OpenAI Configuration
 */
export const openaiConfig: OpenAIConfig = {
  apiKey: env.OPENAI_API_KEY,
  model: env.OPENAI_MODEL || 'gpt-3.5-turbo',
  maxTokens: env.OPENAI_MAX_TOKENS || 2000,
  enabled: !!env.OPENAI_API_KEY,
};

/**
 * Gateway Configuration
 */
export const gatewayConfig: AIGatewayConfig = {
  requestTimeout: env.AI_GATEWAY_REQUEST_TIMEOUT || 30000,
  maxRetries: env.AI_GATEWAY_MAX_RETRIES || 2,
  enableCaching: true, // Future feature
  enableFallback: true, // Future feature
};

/**
 * Default Quota Configuration
 */
export const quotaConfig: QuotaConfig = {
  dailyLimit: env.AI_QUOTA_DAILY_LIMIT || 1000,
  monthlyLimit: env.AI_QUOTA_MONTHLY_LIMIT || 10000,
  monthlySpendLimit: env.AI_QUOTA_MONTHLY_SPEND_LIMIT || 10.0,
  defaultTier: 'free',
};

/**
 * Complete AI Gateway Configuration
 */
export const aiGatewayConfig: AIGatewayFullConfig = {
  openai: openaiConfig,
  gateway: gatewayConfig,
  quota: quotaConfig,
};

/**
 * Validate AI Gateway Configuration
 *
 * Checks that required configuration is present and valid.
 * Logs warnings for missing optional configuration.
 */
export function validateAIGatewayConfig(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check OpenAI configuration
  if (!openaiConfig.enabled) {
    warnings.push('OPENAI_API_KEY not set - OpenAI provider will not be available');
  }

  if (openaiConfig.maxTokens < 1 || openaiConfig.maxTokens > 128000) {
    errors.push('OPENAI_MAX_TOKENS must be between 1 and 128000');
  }

  // Check gateway configuration
  if (gatewayConfig.requestTimeout < 1000) {
    errors.push('AI_GATEWAY_REQUEST_TIMEOUT must be at least 1000ms');
  }

  if (gatewayConfig.requestTimeout > 300000) {
    warnings.push('AI_GATEWAY_REQUEST_TIMEOUT is very high (>5 minutes)');
  }

  if (gatewayConfig.maxRetries < 0 || gatewayConfig.maxRetries > 5) {
    warnings.push('AI_GATEWAY_MAX_RETRIES should be between 0 and 5');
  }

  // Check quota configuration
  if (quotaConfig.dailyLimit < 1) {
    errors.push('AI_QUOTA_DAILY_LIMIT must be at least 1');
  }

  if (quotaConfig.monthlyLimit < quotaConfig.dailyLimit) {
    warnings.push('AI_QUOTA_MONTHLY_LIMIT is less than daily limit');
  }

  if (quotaConfig.monthlySpendLimit < 0) {
    errors.push('AI_QUOTA_MONTHLY_SPEND_LIMIT must be positive');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Display AI Gateway Configuration Info
 *
 * Logs configuration summary (non-sensitive information only).
 */
export function displayAIGatewayConfig(): void {
  console.log('\n🤖 AI Gateway Configuration:');
  console.log(`   OpenAI Enabled: ${openaiConfig.enabled ? '✓' : '✗'}`);
  if (openaiConfig.enabled) {
    console.log(`   OpenAI Model: ${openaiConfig.model}`);
    console.log(`   Max Tokens: ${openaiConfig.maxTokens}`);
  }
  console.log(`   Request Timeout: ${gatewayConfig.requestTimeout}ms`);
  console.log(`   Max Retries: ${gatewayConfig.maxRetries}`);
  console.log(`   Default Daily Quota: ${quotaConfig.dailyLimit}`);
  console.log(`   Default Monthly Quota: ${quotaConfig.monthlyLimit}`);
  console.log(`   Default Spend Limit: $${quotaConfig.monthlySpendLimit}\n`);

  // Validate and show warnings
  const validation = validateAIGatewayConfig();
  if (validation.warnings.length > 0) {
    console.log('⚠️  AI Gateway Warnings:');
    validation.warnings.forEach((warning) => console.log(`   - ${warning}`));
    console.log('');
  }
  if (validation.errors.length > 0) {
    console.log('❌ AI Gateway Configuration Errors:');
    validation.errors.forEach((error) => console.log(`   - ${error}`));
    console.log('');
  }
}

export default aiGatewayConfig;
