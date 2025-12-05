import { getGeminiModel, generationConfig } from '../config/gemini';
import { cacheService } from './cache.service';
import { prisma } from '../config/database';
import { env } from '../config/env';
import {
  CorrectTextRequest,
  CorrectTextResponse,
  DefineWordRequest,
  DefineWordResponse,
  GenerateSuggestionsRequest,
  GenerateSuggestionsResponse,
  AnalyzeWritingStyleRequest,
  AnalyzeWritingStyleResponse,
} from '../types/llm.types';
import { AIServiceError } from '../utils/errors';
import logger from '../utils/logger';
import crypto from 'crypto';

/**
 * LLM Service
 * Handles AI-powered text processing using Gemini AI with retry logic
 */
class LLMService {
  private readonly CACHE_TTL = env.CACHE_TTL_LLM;
  private readonly MODEL_NAME = env.GEMINI_MODEL;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Generate cache hash for input
   */
  private generateHash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
  }

  /**
   * Retry wrapper for Gemini API calls with exponential backoff
   */
  private async withRetry<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        logger.warn(`${operationName} failed (attempt ${attempt}/${this.MAX_RETRIES}):`, error);

        if (attempt < this.MAX_RETRIES) {
          // Exponential backoff
          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
          logger.info(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`${operationName} failed after ${this.MAX_RETRIES} attempts`);
  }

  /**
   * Correct text
   * @param userId - User ID
   * @param request - Correction request
   * @returns Corrected text with changes
   */
  async correctText(userId: string, request: CorrectTextRequest): Promise<CorrectTextResponse> {
    try {
      // Generate cache key
      const hash = this.generateHash(request.text + (request.context || ''));
      const cacheKey = cacheService.llmCacheKey('correct', hash);

      // Check cache
      const cached = await cacheService.get<CorrectTextResponse>(cacheKey);
      if (cached) {
        logger.info(`Text correction cache hit for user ${userId}`);
        return { ...cached, cached: true };
      }

      // Generate prompt
      const prompt = this.createCorrectionPrompt(request);

      // Call Gemini AI with retry logic
      const text = await this.withRetry(async () => {
        const model = getGeminiModel();
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: generationConfig.textCorrection,
        });

        const response = await result.response;
        return response.text();
      }, 'Text correction');

      // Parse response
      const correctedText = this.parseCorrectionResponse(text, request.text);

      // Cache result
      await cacheService.setex(cacheKey, correctedText, this.CACHE_TTL);

      // Log usage
      await this.logUsage(userId, 'correct_text', text.length, false);

      logger.info(`Text corrected for user ${userId}`);
      return { ...correctedText, cached: false };
    } catch (error) {
      logger.error('Error correcting text:', error);
      throw new AIServiceError('Failed to correct text');
    }
  }

  /**
   * Define word using AI
   */
  async defineWord(userId: string, request: DefineWordRequest): Promise<DefineWordResponse> {
    try {
      // Generate cache key
      const hash = this.generateHash(request.word + (request.context || ''));
      const cacheKey = cacheService.llmCacheKey('define', hash);

      // Check cache
      const cached = await cacheService.get<DefineWordResponse>(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }

      // Generate prompt
      const prompt = `Define the word "${request.word}"${request.context ? ` in the context: "${request.context}"` : ''}.
Provide:
1. A clear definition
2. 2-3 example sentences
3. Synonyms (if applicable)
4. Antonyms (if applicable)
5. Part of speech

Format as JSON:
{
  "word": "${request.word}",
  "definition": "...",
  "examples": ["...", "..."],
  "synonyms": ["...", "..."],
  "antonyms": ["...", "..."],
  "partOfSpeech": "noun/verb/etc"
}`;

      const text = await this.withRetry(async () => {
        const model = getGeminiModel();
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: generationConfig.definition,
        });

        const response = await result.response;
        return response.text();
      }, 'Word definition');

      // Parse JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const definition: DefineWordResponse = JSON.parse(jsonMatch[0]);
      definition.cached = false;

      // Cache result
      await cacheService.setex(cacheKey, definition, this.CACHE_TTL);

      // Log usage
      await this.logUsage(userId, 'define_word', text.length, false);

      return definition;
    } catch (error) {
      logger.error('Error defining word:', error);
      throw new AIServiceError('Failed to define word');
    }
  }

  /**
   * Generate text suggestions
   */
  async generateSuggestions(
    userId: string,
    request: GenerateSuggestionsRequest
  ): Promise<GenerateSuggestionsResponse> {
    try {
      // Generate cache key
      const hash = this.generateHash(request.text + request.type);
      const cacheKey = cacheService.llmCacheKey('suggest', hash);

      // Check cache
      const cached = await cacheService.get<GenerateSuggestionsResponse>(cacheKey);
      if (cached) {
        return { ...cached, cached: true };
      }

      // Generate prompt based on type
      let prompt = '';
      switch (request.type) {
        case 'paraphrase':
          prompt = `Paraphrase the following text in ${request.count || 3} different ways:\n\n"${request.text}"`;
          break;
        case 'expand':
          prompt = `Expand the following text with more details and context:\n\n"${request.text}"`;
          break;
        case 'summarize':
          prompt = `Summarize the following text concisely:\n\n"${request.text}"`;
          break;
        case 'improve':
          prompt = `Improve the following text for clarity, grammar, and style:\n\n"${request.text}"`;
          break;
      }

      const text = await this.withRetry(async () => {
        const model = getGeminiModel();
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: generationConfig.suggestions,
        });

        const response = await result.response;
        return response.text();
      }, 'Generate suggestions');

      // Parse suggestions
      const suggestions = text
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .slice(0, request.count || 3);

      const suggestionResponse: GenerateSuggestionsResponse = {
        originalText: request.text,
        suggestions,
        type: request.type,
        cached: false,
      };

      // Cache result
      await cacheService.setex(cacheKey, suggestionResponse, this.CACHE_TTL);

      // Log usage
      await this.logUsage(userId, 'generate_suggestions', text.length, false);

      return suggestionResponse;
    } catch (error) {
      logger.error('Error generating suggestions:', error);
      throw new AIServiceError('Failed to generate suggestions');
    }
  }

  /**
   * Analyze writing style
   */
  async analyzeWritingStyle(
    userId: string,
    request: AnalyzeWritingStyleRequest
  ): Promise<AnalyzeWritingStyleResponse> {
    try {
      // Basic analysis
      const words = request.text.split(/\s+/).filter((w) => w.length > 0);
      const sentences = request.text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const wordCount = words.length;
      const sentenceCount = sentences.length;
      const avgWordsPerSentence = wordCount / (sentenceCount || 1);

      // Count complex words (more than 2 syllables - simplified)
      const complexWords = words.filter((word) => word.length > 7).length;

      // Use AI for tone analysis
      const prompt = `Analyze the tone and provide improvement suggestions for this text:

"${request.text}"

Provide:
1. Overall tone (formal/informal/professional/casual/etc)
2. 3-5 specific suggestions to improve the writing

Format as JSON:
{
  "tone": "...",
  "suggestions": ["...", "...", "..."]
}`;

      const text = await this.withRetry(async () => {
        const model = getGeminiModel();
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: generationConfig.analysis,
        });

        const response = await result.response;
        return response.text();
      }, 'Writing style analysis');

      // Parse AI response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const aiAnalysis = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : { tone: 'neutral', suggestions: [] };

      // Calculate readability score (simplified Flesch Reading Ease)
      const readabilityScore = Math.max(
        0,
        Math.min(100, 206.835 - 1.015 * avgWordsPerSentence - 84.6 * (complexWords / wordCount))
      );

      const analysisResponse: AnalyzeWritingStyleResponse = {
        text: request.text,
        analysis: {
          tone: aiAnalysis.tone,
          readabilityScore: Math.round(readabilityScore),
          wordCount,
          sentenceCount,
          averageWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
          complexWords,
          suggestions: aiAnalysis.suggestions,
        },
        cached: false,
      };

      // Log usage
      await this.logUsage(userId, 'analyze_style', text.length, false);

      return analysisResponse;
    } catch (error) {
      logger.error('Error analyzing writing style:', error);
      throw new AIServiceError('Failed to analyze writing style');
    }
  }

  /**
   * Create correction prompt
   */
  private createCorrectionPrompt(request: CorrectTextRequest): string {
    let prompt = `Correct the following text for grammar, spelling, and punctuation errors:\n\n"${request.text}"`;

    if (request.context) {
      prompt += `\n\nContext: ${request.context}`;
    }

    prompt += `\n\nProvide the corrected text only, preserving the original formatting.`;

    return prompt;
  }

  /**
   * Parse correction response
   */
  private parseCorrectionResponse(aiResponse: string, originalText: string): CorrectTextResponse {
    // Simple parsing - extract corrected text
    const correctedText = aiResponse.trim();

    return {
      originalText,
      correctedText,
      changes: [], // Simplified - could add diff detection
      suggestions: [],
    };
  }

  /**
   * Log AI usage
   */
  private async logUsage(
    userId: string,
    operation: string,
    outputLength: number,
    cached: boolean
  ): Promise<void> {
    try {
      await prisma.aIUsageLog.create({
        data: {
          userId,
          operation,
          inputTokens: 0, // Simplified - could add token counting
          outputTokens: Math.ceil(outputLength / 4), // Rough estimate
          totalTokens: Math.ceil(outputLength / 4),
          model: this.MODEL_NAME,
          cached,
        },
      });
    } catch (error) {
      logger.warn('Failed to log AI usage:', error);
    }
  }
}

// Export singleton instance
export const llmService = new LLMService();
export default llmService;
