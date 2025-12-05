import { prisma } from '../config/database';
import { cacheService } from './cache.service';
import { freeDictionaryService } from './freeDictionary.service';
import { getGeminiModel } from '../config/gemini';
import { env } from '../config/env';
import { DictionaryEntry } from '../types/dictionary.types';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Dictionary Service
 * Intelligent multi-layer caching system for word definitions with fallback chain.
 * Implements 4-level cache strategy: Redis (L1) -> PostgreSQL (L2) -> Free Dictionary API (L3) -> Gemini AI (L4)
 *
 * @description This service manages dictionary operations with intelligent caching to minimize
 * external API calls. It maintains access statistics for popular words and handles automatic
 * cache expiration. The service seamlessly falls back through multiple data sources to ensure
 * definitions are always available.
 *
 * @class
 * @example
 * const entry = await dictionaryService.searchWord('eloquent');
 * if (entry) {
 *   console.log(entry.meanings); // Word definitions
 * }
 */
class DictionaryService {
  private readonly CACHE_TTL = env.CACHE_TTL_DICTIONARY;

  /**
   * Search for a word with multi-layer intelligent caching
   * @description Searches for a word definition through a 4-layer cache system. Checks Redis first,
   * then PostgreSQL, then Free Dictionary API, and finally falls back to Gemini AI. Each layer
   * automatically populates subsequent layers on hit. Updates access statistics for analytics.
   *
   * @param {string} word - The word to search for (case-insensitive, whitespace trimmed)
   * @returns {Promise<DictionaryEntry|null>} Complete dictionary entry or null if not found
   * @returns {string} .word - The normalized word
   * @returns {string} [.phonetic] - Phonetic pronunciation
   * @returns {Array} .meanings - Array of meanings with parts of speech and definitions
   * @returns {string} [.origin] - Etymology or origin of the word
   * @throws {Error} May throw if database or external API errors occur
   *
   * @example
   * const entry = await dictionaryService.searchWord('serendipity');
   * // Returns { word: 'serendipity', meanings: [...], phonetic: '...', origin: '...' }
   */
  async searchWord(word: string): Promise<DictionaryEntry | null> {
    const normalizedWord = word.toLowerCase().trim();

    try {
      // Layer 1: Check Redis cache
      const cached = await this.getFromRedisCache(normalizedWord);
      if (cached) {
        logger.info(`Word found in Redis cache: ${normalizedWord}`);
        await this.updateAccessCount(normalizedWord);
        return cached;
      }

      // Layer 2: Check PostgreSQL cache
      const dbEntry = await this.getFromDatabase(normalizedWord);
      if (dbEntry) {
        logger.info(`Word found in database: ${normalizedWord}`);
        await this.cacheToRedis(normalizedWord, dbEntry);
        await this.updateAccessCount(normalizedWord);
        return dbEntry;
      }

      // Layer 3: Fetch from Free Dictionary API
      const apiEntry = await freeDictionaryService.fetchWordDefinition(normalizedWord);
      if (apiEntry) {
        logger.info(`Word fetched from Free Dictionary API: ${normalizedWord}`);
        await this.cacheEntry(normalizedWord, apiEntry, 'free_dictionary_api');
        return apiEntry;
      }

      // Layer 4: Fallback to Gemini AI
      const aiEntry = await this.fetchFromGemini(normalizedWord);
      if (aiEntry) {
        logger.info(`Word defined by Gemini AI: ${normalizedWord}`);
        await this.cacheEntry(normalizedWord, aiEntry, 'gemini_ai');
        return aiEntry;
      }

      logger.info(`Word not found anywhere: ${normalizedWord}`);
      return null;
    } catch (error) {
      logger.error(`Error searching for word ${normalizedWord}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve word definition from Redis cache (Layer 1)
   * @description Attempts to fetch a cached dictionary entry from Redis. Gracefully handles cache
   * misses and errors without throwing, returning null on any failure.
   *
   * @param {string} word - The normalized word to look up
   * @returns {Promise<DictionaryEntry|null>} Cached entry if found, null otherwise
   * @private
   *
   * @example
   * const cached = await this.getFromRedisCache('eloquent');
   */
  private async getFromRedisCache(word: string): Promise<DictionaryEntry | null> {
    try {
      const cacheKey = cacheService.dictionaryKey(word);
      return await cacheService.get<DictionaryEntry>(cacheKey);
    } catch (error) {
      logger.warn(`Redis cache error for ${word}:`, error);
      return null;
    }
  }

  /**
   * Retrieve word definition from PostgreSQL database (Layer 2)
   * @description Fetches a dictionary entry from PostgreSQL with automatic expiration handling.
   * Entries that have expired are automatically deleted. Returns null for expired or missing entries.
   *
   * @param {string} word - The normalized word to look up
   * @returns {Promise<DictionaryEntry|null>} Database entry if found and not expired, null otherwise
   * @private
   *
   * @example
   * const dbEntry = await this.getFromDatabase('eloquent');
   */
  private async getFromDatabase(word: string): Promise<DictionaryEntry | null> {
    try {
      const entry = await prisma.dictionaryEntry.findUnique({
        where: { word },
      });

      if (!entry) {
        return null;
      }

      // Check if cache is expired
      if (entry.expiresAt && entry.expiresAt < new Date()) {
        await prisma.dictionaryEntry.delete({ where: { word } });
        return null;
      }

      // Convert database entry to DictionaryEntry
      return {
        word: entry.word,
        phonetic: entry.phonetic || undefined,
        meanings: entry.meanings as any,
        origin: entry.origin || undefined,
      };
    } catch (error) {
      logger.error(`Database error for ${word}:`, error);
      return null;
    }
  }

  /**
   * Cache dictionary entry to both Redis and PostgreSQL
   * @description Stores a dictionary entry across both cache layers. Sets expiration time
   * and creates/updates database record with access statistics. Handles both new inserts
   * and updates to existing entries.
   *
   * @param {string} word - The word being cached
   * @param {DictionaryEntry} entry - The complete dictionary entry to cache
   * @param {string} source - Source of the definition (e.g., 'free_dictionary_api', 'gemini_ai', 'manual')
   * @returns {Promise<void>} Completes when caching is done or logs on failure
   * @private
   *
   * @example
   * await this.cacheEntry('eloquent', definition, 'free_dictionary_api');
   */
  private async cacheEntry(word: string, entry: DictionaryEntry, source: string): Promise<void> {
    try {
      // Cache to Redis
      await this.cacheToRedis(word, entry);

      // Cache to database
      const expiresAt = new Date(Date.now() + this.CACHE_TTL * 1000);

      await prisma.dictionaryEntry.upsert({
        where: { word },
        create: {
          word,
          phonetic: entry.phonetic || null,
          meanings: entry.meanings as any,
          origin: entry.origin || null,
          source,
          expiresAt,
        },
        update: {
          phonetic: entry.phonetic || null,
          meanings: entry.meanings as any,
          origin: entry.origin || null,
          source,
          lastAccessed: new Date(),
          accessCount: {
            increment: 1,
          },
          expiresAt,
        },
      });
    } catch (error) {
      logger.error(`Error caching entry for ${word}:`, error);
    }
  }

  /**
   * Cache dictionary entry to Redis only
   * @description Stores a dictionary entry in Redis with TTL expiration for fast retrieval
   * in subsequent requests. Non-critical operation; failures are logged but don't block.
   *
   * @param {string} word - The word being cached
   * @param {DictionaryEntry} entry - The dictionary entry to cache
   * @returns {Promise<void>} Completes when caching is done or logged on failure
   * @private
   *
   * @example
   * await this.cacheToRedis('eloquent', definition);
   */
  private async cacheToRedis(word: string, entry: DictionaryEntry): Promise<void> {
    try {
      const cacheKey = cacheService.dictionaryKey(word);
      await cacheService.setex(cacheKey, entry, this.CACHE_TTL);
    } catch (error) {
      logger.warn(`Failed to cache to Redis for ${word}:`, error);
    }
  }

  /**
   * Update word access count and timestamp in database
   * @description Records access statistics for tracking popular words and usage patterns.
   * Updates last accessed timestamp and increments access counter for analytics.
   *
   * @param {string} word - The word being accessed
   * @returns {Promise<void>} Completes when update is done or logs on failure
   * @private
   *
   * @example
   * await this.updateAccessCount('eloquent');
   */
  private async updateAccessCount(word: string): Promise<void> {
    try {
      await prisma.dictionaryEntry.update({
        where: { word },
        data: {
          lastAccessed: new Date(),
          accessCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      // Don't throw, just log
      logger.warn(`Failed to update access count for ${word}:`, error);
    }
  }

  /**
   * Fetch word definition from Gemini AI (Layer 4 - Final Fallback)
   * @description Uses Gemini AI as the ultimate fallback when Free Dictionary API has no result.
   * Constructs a detailed prompt requesting structured JSON output matching DictionaryEntry format.
   * Returns null on any parsing or API errors instead of throwing.
   *
   * @param {string} word - The word to define using AI
   * @returns {Promise<DictionaryEntry|null>} AI-generated dictionary entry or null on failure
   * @private
   *
   * @example
   * const aiDefinition = await this.fetchFromGemini('eloquent');
   */
  private async fetchFromGemini(word: string): Promise<DictionaryEntry | null> {
    try {
      const model = getGeminiModel();

      const prompt = `Define the word "${word}" in a structured format. Include:
1. Phonetic pronunciation (if applicable)
2. All meanings with part of speech
3. Example sentences
4. Origin/etymology (if known)

Format as JSON with this structure:
{
  "word": "${word}",
  "phonetic": "pronunciation",
  "meanings": [
    {
      "partOfSpeech": "noun/verb/etc",
      "definitions": [
        {
          "definition": "...",
          "example": "..."
        }
      ]
    }
  ],
  "origin": "..."
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed as DictionaryEntry;
    } catch (error) {
      logger.error(`Gemini AI error for word ${word}:`, error);
      return null;
    }
  }

  /**
   * Add or update a word in the dictionary (Admin Operation)
   * @description Manually adds a dictionary entry to both Redis and PostgreSQL caches.
   * Used by administrators to add custom definitions or override existing entries.
   * Marks the source as 'manual' for tracking purposes.
   *
   * @param {DictionaryEntry} entry - The complete dictionary entry to add
   * @param {string} entry.word - The word to add
   * @param {Array} entry.meanings - Array of word meanings
   * @param {string} [entry.phonetic] - Optional phonetic pronunciation
   * @param {string} [entry.origin] - Optional etymology/origin
   * @returns {Promise<void>} Completes when word is added to cache
   * @throws {Error} If caching operation fails
   *
   * @example
   * await dictionaryService.addWord({
   *   word: 'eloquent',
   *   meanings: [...],
   *   phonetic: '/ˈɛl.ə.kwənt/',
   *   origin: 'From Latin eloquens'
   * });
   */
  async addWord(entry: DictionaryEntry): Promise<void> {
    try {
      await this.cacheEntry(entry.word, entry, 'manual');
      logger.info(`Word manually added to dictionary: ${entry.word}`);
    } catch (error) {
      logger.error(`Error adding word ${entry.word}:`, error);
      throw error;
    }
  }

  /**
   * Refresh a dictionary entry by clearing cache and fetching fresh data (Admin Operation)
   * @description Removes a word from both Redis and PostgreSQL caches, then performs
   * a fresh search through all layers to reload the definition. Useful for updating stale
   * entries or forcing a re-fetch from the Free Dictionary API or Gemini AI.
   *
   * @param {string} word - The word to refresh (case-insensitive)
   * @returns {Promise<DictionaryEntry>} Freshly fetched dictionary entry
   * @throws {NotFoundError} If the word cannot be found after refresh
   * @throws {Error} If refresh operation fails
   *
   * @example
   * const updated = await dictionaryService.refreshCacheEntry('eloquent');
   */
  async refreshCacheEntry(word: string): Promise<DictionaryEntry> {
    try {
      const normalizedWord = word.toLowerCase().trim();

      // Delete from cache
      await cacheService.delete(cacheService.dictionaryKey(normalizedWord));
      await prisma.dictionaryEntry
        .delete({
          where: { word: normalizedWord },
        })
        .catch(() => {});

      // Fetch fresh data
      const entry = await this.searchWord(normalizedWord);
      if (!entry) {
        throw new NotFoundError('Word not found');
      }

      return entry;
    } catch (error) {
      logger.error(`Error refreshing cache for ${word}:`, error);
      throw error;
    }
  }

  /**
   * Get most frequently accessed words from the dictionary
   * @description Retrieves a list of the most popular words based on access count.
   * Useful for analytics, recommendations, or preloading frequently used definitions.
   *
   * @param {number} [limit=10] - Maximum number of words to return
   * @returns {Promise<string[]>} Array of word strings sorted by access count (descending)
   *
   * @example
   * const popular = await dictionaryService.getPopularWords(5);
   * // Returns: ['the', 'of', 'and', 'to', 'a']
   */
  async getPopularWords(limit: number = 10): Promise<string[]> {
    try {
      const entries: { word: string }[] = await prisma.dictionaryEntry.findMany({
        orderBy: { accessCount: 'desc' },
        take: limit,
        select: { word: true },
      });

      return entries.map((e) => e.word);
    } catch (error) {
      logger.error('Error getting popular words:', error);
      return [];
    }
  }
}

// Export singleton instance
export const dictionaryService = new DictionaryService();
export default dictionaryService;
