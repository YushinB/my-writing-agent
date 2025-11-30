import { prisma } from '../config/database';
import { SavedWord } from '@prisma/client';
import { NotFoundError, ConflictError } from '../utils/errors';
import { calculateOffset, createPaginationMeta } from '../utils/transform';
import logger from '../utils/logger';

/**
 * My Words Service
 * Manages user's saved words
 */
class MyWordsService {
  /**
   * Get user's saved words (paginated)
   * @param userId - User ID
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated saved words
   */
  async getUserWords(userId: string, page: number = 1, limit: number = 10) {
    try {
      const offset = calculateOffset(page, limit);

      // Get total count
      const total = await prisma.savedWord.count({
        where: { userId },
      });

      // Get words
      const words = await prisma.savedWord.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      });

      return {
        words,
        pagination: createPaginationMeta(total, page, limit),
      };
    } catch (error) {
      logger.error(`Error getting words for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Add word to user's dictionary
   * @param userId - User ID
   * @param word - Word to add
   * @param notes - Optional notes
   * @returns Created saved word
   */
  async addWord(userId: string, word: string, notes?: string): Promise<SavedWord> {
    try {
      const normalizedWord = word.toLowerCase().trim();

      // Check if word already exists
      const existing = await prisma.savedWord.findUnique({
        where: {
          userId_word: {
            userId,
            word: normalizedWord,
          },
        },
      });

      if (existing) {
        throw new ConflictError('Word already in your dictionary');
      }

      // Add word
      const savedWord = await prisma.savedWord.create({
        data: {
          userId,
          word: normalizedWord,
          notes,
        },
      });

      logger.info(`Word added for user ${userId}: ${normalizedWord}`);
      return savedWord;
    } catch (error) {
      logger.error(`Error adding word for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Remove word from user's dictionary
   * @param userId - User ID
   * @param wordId - Saved word ID
   */
  async removeWord(userId: string, wordId: string): Promise<void> {
    try {
      // Check if word exists and belongs to user
      const savedWord = await prisma.savedWord.findUnique({
        where: { id: wordId },
      });

      if (!savedWord) {
        throw new NotFoundError('Word not found');
      }

      if (savedWord.userId !== userId) {
        throw new NotFoundError('Word not found in your dictionary');
      }

      // Delete word
      await prisma.savedWord.delete({
        where: { id: wordId },
      });

      logger.info(`Word removed for user ${userId}: ${savedWord.word}`);
    } catch (error) {
      logger.error(`Error removing word ${wordId}:`, error);
      throw error;
    }
  }

  /**
   * Update word notes
   * @param userId - User ID
   * @param wordId - Saved word ID
   * @param notes - New notes
   * @returns Updated saved word
   */
  async updateNotes(userId: string, wordId: string, notes: string): Promise<SavedWord> {
    try {
      // Check if word exists and belongs to user
      const savedWord = await prisma.savedWord.findUnique({
        where: { id: wordId },
      });

      if (!savedWord) {
        throw new NotFoundError('Word not found');
      }

      if (savedWord.userId !== userId) {
        throw new NotFoundError('Word not found in your dictionary');
      }

      // Update notes
      const updated = await prisma.savedWord.update({
        where: { id: wordId },
        data: { notes },
      });

      logger.info(`Notes updated for word ${wordId}`);
      return updated;
    } catch (error) {
      logger.error(`Error updating notes for word ${wordId}:`, error);
      throw error;
    }
  }

  /**
   * Search user's saved words
   * @param userId - User ID
   * @param query - Search query
   * @param page - Page number
   * @param limit - Items per page
   * @returns Matching saved words
   */
  async searchWords(userId: string, query: string, page: number = 1, limit: number = 10) {
    try {
      const offset = calculateOffset(page, limit);
      const searchTerm = `%${query.toLowerCase()}%`;

      // Get total count
      const total = await prisma.savedWord.count({
        where: {
          userId,
          OR: [
            { word: { contains: query.toLowerCase() } },
            { notes: { contains: query, mode: 'insensitive' } },
          ],
        },
      });

      // Get words
      const words = await prisma.savedWord.findMany({
        where: {
          userId,
          OR: [
            { word: { contains: query.toLowerCase() } },
            { notes: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      });

      return {
        words,
        pagination: createPaginationMeta(total, page, limit),
      };
    } catch (error) {
      logger.error(`Error searching words for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if word is saved by user
   * @param userId - User ID
   * @param word - Word to check
   * @returns True if word is saved
   */
  async isWordSaved(userId: string, word: string): Promise<boolean> {
    try {
      const normalizedWord = word.toLowerCase().trim();

      const savedWord = await prisma.savedWord.findUnique({
        where: {
          userId_word: {
            userId,
            word: normalizedWord,
          },
        },
      });

      return savedWord !== null;
    } catch (error) {
      logger.error(`Error checking if word is saved:`, error);
      return false;
    }
  }

  /**
   * Get total word count for user
   * @param userId - User ID
   * @returns Total saved words count
   */
  async getWordCount(userId: string): Promise<number> {
    try {
      return await prisma.savedWord.count({
        where: { userId },
      });
    } catch (error) {
      logger.error(`Error getting word count for user ${userId}:`, error);
      return 0;
    }
  }
}

// Export singleton instance
export const myWordsService = new MyWordsService();
export default myWordsService;
