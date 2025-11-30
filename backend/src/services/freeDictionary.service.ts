import axios, { AxiosError } from 'axios';
import { env } from '../config/env';
import {
  FreeDictionaryApiResponse,
  DictionaryEntry,
} from '../types/dictionary.types';
import { transformFreeDictionaryResponse } from '../utils/transform';
import { ExternalApiError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Free Dictionary API Service
 * Fetches word definitions from Free Dictionary API
 */
class FreeDictionaryService {
  private readonly API_URL = env.FREE_DICTIONARY_API_URL;
  private readonly REQUEST_DELAY = 100; // Respectful rate limiting (ms)
  private lastRequestTime = 0;

  /**
   * Fetch word definition from Free Dictionary API
   * @param word - Word to look up
   * @returns Dictionary entry or null if not found
   */
  async fetchWordDefinition(word: string): Promise<DictionaryEntry | null> {
    try {
      // Rate limiting - wait if needed
      await this.respectRateLimit();

      // Make request to Free Dictionary API
      const url = `${this.API_URL}/${encodeURIComponent(word.toLowerCase())}`;

      const response = await axios.get<FreeDictionaryApiResponse[]>(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'ProsePolish/1.0',
        },
      });

      // API returns an array, we take the first result
      if (!response.data || response.data.length === 0) {
        return null;
      }

      const apiResponse = response.data[0];

      // Transform to our format
      const entry = transformFreeDictionaryResponse(apiResponse);

      logger.info(`Fetched definition for word: ${word}`);
      return entry;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        // Handle 404 - word not found
        if (axiosError.response?.status === 404) {
          logger.info(`Word not found in Free Dictionary API: ${word}`);
          return null;
        }

        // Handle rate limiting
        if (axiosError.response?.status === 429) {
          logger.warn('Free Dictionary API rate limit exceeded');
          throw new ExternalApiError('Dictionary API rate limit exceeded');
        }

        // Handle other errors
        logger.error(`Free Dictionary API error for word ${word}:`, {
          status: axiosError.response?.status,
          message: axiosError.message,
        });

        throw new ExternalApiError(
          `Failed to fetch definition: ${axiosError.message}`
        );
      }

      logger.error(`Unexpected error fetching word ${word}:`, error);
      throw new ExternalApiError('Failed to fetch word definition');
    }
  }

  /**
   * Respectful rate limiting - delay between requests
   */
  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.REQUEST_DELAY) {
      const delay = this.REQUEST_DELAY - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Test API connection
   * @returns True if API is accessible
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.fetchWordDefinition('test');
      return result !== null;
    } catch (error) {
      logger.error('Free Dictionary API connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const freeDictionaryService = new FreeDictionaryService();
export default freeDictionaryService;
