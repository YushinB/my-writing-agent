import OpenAI from 'openai';
import type {
  ModelAdapter,
  ModelCapabilities,
  GenerateRequest,
  GenerateResult,
  HealthStatus,
  CostEstimate,
  QuotaStatus,
  RateLimitInfo,
} from '../types';
import { errorHandler } from '../core/ErrorHandler';

export class OpenAIAdapter implements ModelAdapter {
  public providerName = 'openai';
  public modelId: string;
  public capabilities: ModelCapabilities;

  private client: OpenAI;

  constructor(apiKey: string, modelId: string = 'gpt-3.5-turbo') {
    this.modelId = modelId;
    this.client = new OpenAI({ apiKey });
    
    // Set capabilities based on model
    this.capabilities = {
      maxTokens: modelId.includes('gpt-4') ? 8192 : 4096,
      supportsStreaming: true,
      supportsSystemPrompt: true,
      supportsFunctions: true,
    };
  }

  // Generate text using OpenAI chat/completions
  async generate(request: GenerateRequest): Promise<GenerateResult> {
    try {
      const messages = this.buildMessages(request);

      // map options
      const max_tokens = request.options?.maxTokens ?? 1000;
      const temperature = request.options?.temperature ?? 0.7;

      const resp: any = await this.client.chat.completions.create({
        model: this.modelId,
        messages,
        max_tokens,
        temperature,
      });

      const output = this.transformResponse(resp);

      return {
        provider: this.providerName,
        model: this.modelId,
        output: output.text,
        usage: output.usage,
        latency: resp._meta?.request_duration_ms ?? null,
        cached: false,
        costEstimate: await this.estimateCost(request),
        raw: resp,
      } as GenerateResult;
    } catch (err: any) {
      // Use ErrorHandler to convert provider errors to standardized errors
      throw errorHandler.handleProviderError(err, this.providerName);
    }
  }

  // Simple health check calling a very small request or /models endpoint if available
  async health(): Promise<HealthStatus> {
    try {
      const startTime = Date.now();
      // Use a lightweight call to verify API key works
      await this.client.models.retrieve(this.modelId);
      const latency = Date.now() - startTime;
      return {
        healthy: true,
        latency,
        lastChecked: new Date(),
      } as HealthStatus;
    } catch (err: any) {
      const error = errorHandler.handleProviderError(err, this.providerName);
      return {
        healthy: false,
        lastChecked: new Date(),
        message: error.message,
        errorRate: 1.0,
      } as HealthStatus;
    }
  }

  // Estimate cost using simple pricing assumptions
  async estimateCost(request: GenerateRequest): Promise<CostEstimate> {
    const promptTokens = this.estimateTokens(request.prompt || '');
    const completionTokens = request.options?.maxTokens ?? 1000;

    // Simple pricing rules: adjust as needed per model
    let promptRate = 0.03 / 1000; // default GPT-4 style
    let completionRate = 0.06 / 1000;

    if (/gpt-3\.5/i.test(this.modelId)) {
      promptRate = 0.0015 / 1000; // example lower price
      completionRate = 0.002 / 1000;
    }

    const promptCost = promptTokens * promptRate;
    const completionCost = completionTokens * completionRate;

    return {
      amount: promptCost + completionCost,
      currency: 'USD',
      breakdown: { promptCost, completionCost },
    } as CostEstimate;
  }

  // Placeholder quota check — real implementation should check account / billing endpoints
  async checkQuota(): Promise<QuotaStatus> {
    // OpenAI does not expose a simple per-key quota endpoint in all accounts; return a permissive result
    return { remaining: Infinity, limit: Infinity, resetAt: new Date() } as QuotaStatus;
  }

  getRateLimit(): RateLimitInfo {
    return { requestsPerMinute: 3500, requestsPerDay: 10000 } as RateLimitInfo;
  }

  // -- Utilities and helpers --
  private estimateTokens(text: string): number {
    if (!text) return 0;
    // rough heuristic: 1 token ~= 4 chars in English
    const chars = text.length;
    return Math.max(1, Math.round(chars / 4));
  }

  private buildMessages(request: GenerateRequest) {
    const messages: Array<OpenAI.Chat.Completions.ChatCompletionMessageParam> = [];
    if (request.options?.systemPrompt) {
      messages.push({ role: 'system', content: request.options.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });
    return messages;
  }

  private transformResponse(resp: any) {
    // Transform the OpenAI response to a normalized shape
    try {
      const choice = resp.choices?.[0];
      const text = choice?.message?.content ?? choice?.text ?? '';

      const usage = {
        promptTokens: resp.usage?.prompt_tokens ?? this.estimateTokens(''),
        completionTokens: resp.usage?.completion_tokens ?? 0,
        totalTokens: resp.usage?.total_tokens ?? 0,
      };

      return { text, usage };
    } catch (err) {
      return { text: '', usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } };
    }
  }

  // Removed wrapError - now using ErrorHandler service
}

export default OpenAIAdapter;
