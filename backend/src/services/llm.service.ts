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
 * Handles AI-powered text processing using Gemini AI with retry logic and intelligent caching.
 * Provides methods for text correction, word definitions, suggestion generation, and writing style analysis.
 *
 * @description This service integrates with Google's Gemini AI API to perform various NLP tasks
 * such as grammar correction, vocabulary assistance, and writing analysis. It includes automatic
 * retry logic with exponential backoff for API resilience and Redis caching for performance optimization.
 *
 * @class
 * @example
 * const response = await llmService.correctText(userId, {
 *   text: "The quick broun fox",
 *   context: "English sentence"
 * });
 */
class LLMService {
  private readonly CACHE_TTL = env.CACHE_TTL_LLM;
  private readonly MODEL_NAME = env.GEMINI_MODEL;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Generate cache hash for input
   * @description Creates a SHA-256 hash of the input and returns first 16 characters.
   * Used to create cache keys for LLM responses.
   *
   * @param {string} input - The input string to hash
   * @returns {string} First 16 characters of SHA-256 hash in hexadecimal format
   * @private
   */
  private generateHash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
  }

  /**
   * Retry wrapper for Gemini API calls with exponential backoff
   * @description Executes an async operation with automatic retry logic. On failure, waits
   * with exponential backoff (1s, 2s, 4s) before retrying up to MAX_RETRIES times.
   *
   * @template T - The type of value returned by the operation
   * @param {() => Promise<T>} operation - The async function to execute with retry logic
   * @param {string} operationName - Name of the operation for logging purposes
   * @returns {Promise<T>} The result of the successful operation
   * @throws {Error} If all retry attempts fail, throws the last error encountered
   * @private
   *
   * @example
   * const result = await this.withRetry(
   *   () => model.generateContent(prompt),
   *   'Text generation'
   * );
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
   * Correct text for grammar, spelling, and punctuation errors
   * @description Analyzes text for errors and provides corrections. Results are cached to improve
   * performance on repeated requests for the same content. The method uses exponential backoff
   * retry logic to handle transient API failures.
   *
   * @param {string} userId - Unique identifier of the user making the request
   * @param {CorrectTextRequest} request - Contains text to correct and optional context
   * @param {string} request.text - The text to be corrected
   * @param {string} [request.context] - Optional context for understanding the text
   * @returns {Promise<CorrectTextResponse>} Object containing original and corrected text
   * @returns {string} .originalText - The input text before correction
   * @returns {string} .correctedText - The text after grammatical and punctuation corrections
   * @returns {Array} .changes - Array of detected corrections made
   * @returns {Array} .suggestions - Additional improvement suggestions
   * @returns {boolean} .cached - Whether the result came from cache
   * @throws {AIServiceError} If text correction fails after all retries
   *
   * @example
   * const result = await llmService.correctText('user123', {
   *   text: 'She dont knows how to cooking.',
   *   context: 'English grammar check'
   * });
   * // Returns: { originalText: "...", correctedText: "She doesn't know how to cook.", ... }
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
   * Define word using AI with contextual understanding
   * @description Provides comprehensive word definition including parts of speech, examples,
   * synonyms, and antonyms. Uses AI to understand context and provide relevant definitions.
   * Results are cached for performance.
   *
   * @param {string} userId - Unique identifier of the user making the request
   * @param {DefineWordRequest} request - Contains word and optional context for definition
   * @param {string} request.word - The word to define
   * @param {string} [request.context] - Optional context for understanding word usage
   * @returns {Promise<DefineWordResponse>} Comprehensive word definition object
   * @returns {string} .word - The word being defined
   * @returns {string} .definition - Primary definition of the word
   * @returns {Array<string>} .examples - Example sentences using the word
   * @returns {Array<string>} .synonyms - Words with similar meanings
   * @returns {Array<string>} .antonyms - Words with opposite meanings
   * @returns {string} .partOfSpeech - Grammatical role (noun, verb, adjective, etc.)
   * @returns {boolean} .cached - Whether the result came from cache
   * @throws {AIServiceError} If word definition fails after all retries
   *
   * @example
   * const definition = await llmService.defineWord('user123', {
   *   word: 'serendipity',
   *   context: 'Finding something good by chance'
   * });
   * // Returns: { word: 'serendipity', definition: '...', examples: [...], ... }
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
   * Generate alternative text suggestions based on type
   * @description Creates alternative versions of text for various purposes including paraphrasing,
   * expansion, summarization, and general improvement. Supports multiple suggestion types with
   * configurable output count.
   *
   * @param {string} userId - Unique identifier of the user making the request
   * @param {GenerateSuggestionsRequest} request - Configuration for suggestion generation
   * @param {string} request.text - The text to generate suggestions for
   * @param {string} request.type - Type of suggestions: 'paraphrase' | 'expand' | 'summarize' | 'improve'
   * @param {number} [request.count] - Number of suggestions to generate (default: 3)
   * @returns {Promise<GenerateSuggestionsResponse>} Object containing generated suggestions
   * @returns {string} .originalText - The input text
   * @returns {Array<string>} .suggestions - Array of generated alternative texts
   * @returns {string} .type - The type of suggestions generated
   * @returns {boolean} .cached - Whether the result came from cache
   * @throws {AIServiceError} If suggestion generation fails after all retries
   *
   * @example
   * const suggestions = await llmService.generateSuggestions('user123', {
   *   text: 'The weather is nice today.',
   *   type: 'paraphrase',
   *   count: 2
   * });
   * // Returns suggestions like: "It's a beautiful day.", "Today has pleasant weather."
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
   * Analyze writing style and provide improvement suggestions
   * @description Performs comprehensive analysis of text including word count, sentence count,
   * readability score (Flesch Reading Ease), tone detection, and specific improvement suggestions.
   * Combines basic statistical analysis with AI-powered tone and style assessment.
   *
   * @param {string} userId - Unique identifier of the user making the request
   * @param {AnalyzeWritingStyleRequest} request - Contains text to analyze
   * @param {string} request.text - The text to analyze
   * @returns {Promise<AnalyzeWritingStyleResponse>} Comprehensive style analysis results
   * @returns {string} .text - The input text
   * @returns {Object} .analysis - Detailed analysis metrics
   * @returns {string} .analysis.tone - Detected tone (formal, informal, professional, casual, etc.)
   * @returns {number} .analysis.readabilityScore - Flesch Reading Ease score (0-100)
   * @returns {number} .analysis.wordCount - Total number of words
   * @returns {number} .analysis.sentenceCount - Total number of sentences
   * @returns {number} .analysis.averageWordsPerSentence - Average sentence length
   * @returns {number} .analysis.complexWords - Count of words with more than 7 characters
   * @returns {Array<string>} .analysis.suggestions - Specific improvement recommendations
   * @throws {AIServiceError} If analysis fails after all retries
   *
   * @example
   * const analysis = await llmService.analyzeWritingStyle('user123', {
   *   text: 'The quick brown fox jumps over the lazy dog.'
   * });
   * // Returns: { text: '...', analysis: { tone: 'neutral', readabilityScore: 90, ... } }
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
   * Create correction prompt for AI processing
   * @description Constructs a structured prompt for the AI to correct text. Includes the text,
   * optional context, and instructions for the correction process.
   *
   * @param {CorrectTextRequest} request - Contains text and optional context
   * @returns {string} Formatted prompt ready for Gemini API
   * @private
   *
   * @example
   * const prompt = this.createCorrectionPrompt({
   *   text: 'She dont like pizza.',
   *   context: 'Casual English sentence'
   * });
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
   * Parse correction response from AI
   * @description Extracts corrected text from the AI response and structures it into the response format.
   * Currently provides basic parsing; can be enhanced to detect specific changes made.
   *
   * @param {string} aiResponse - Raw response text from Gemini AI
   * @param {string} originalText - The original text before correction
   * @returns {CorrectTextResponse} Structured response with correction details
   * @private
   *
   * @example
   * const result = this.parseCorrectionResponse(
   *   "She doesn't like pizza.",
   *   "She dont like pizza."
   * );
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
   * Log AI API usage for quota tracking and analytics
   * @description Records details of AI API calls including user, operation type, token counts,
   * model used, and cache status. Used for usage analytics, quota management, and billing.
   * Failures in logging do not block the main operation.
   *
   * @param {string} userId - User who performed the operation
   * @param {string} operation - Type of operation performed (e.g., 'correct_text', 'define_word')
   * @param {number} outputLength - Length of the AI output in characters
   * @param {boolean} cached - Whether the result was served from cache
   * @returns {Promise<void>} Completes when logging is done or logged on failure
   * @private
   *
   * @example
   * await this.logUsage('user123', 'correct_text', 350, false);
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
