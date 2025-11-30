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
 * Multi-layer caching: Redis -> PostgreSQL -> Free Dictionary API -> Gemini AI
 */
class DictionaryService {
  private readonly CACHE_TTL = env.CACHE_TTL_DICTIONARY;

  /**
   * Search for a word with multi-layer caching
   * @param word - Word to search
   * @returns Dictionary entry or null if not found
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
   * Get word from Redis cache
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
   * Get word from PostgreSQL database
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
   * Cache entry to both Redis and database
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
   * Cache to Redis only
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
   * Update access count and timestamp
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
   * Fetch definition from Gemini AI (fallback)
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
   * Add word to dictionary (admin only)
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
   * Refresh cache entry (admin only)
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
   * Get popular words (most accessed)
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
