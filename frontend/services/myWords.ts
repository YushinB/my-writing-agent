import apiClient, { ApiResponse, PaginatedResponse, PaginationMeta } from './api';
import { SavedWord, WordDefinition } from '../types';

// My Words types matching backend API
export interface MyWord {
  id: string;
  word: string;
  definition: string;
  notes?: string;
  addedAt: string;
  lastReviewedAt?: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  synonyms?: string[];
}

export interface AddWordRequest {
  word: string;
  notes?: string;
}

export interface UpdateNotesRequest {
  notes: string;
}

export interface MyWordsListResponse {
  words: MyWord[];
  pagination: PaginationMeta;
}

class MyWordsService {
  /**
   * Get user's saved words with pagination
   */
  async getWords(page: number = 1, limit: number = 10): Promise<{ words: MyWord[]; pagination: PaginationMeta }> {
    const response = await apiClient.get<PaginatedResponse<MyWord>>('/my-words', {
      params: { page, limit },
    });
    return {
      words: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Add a word to the user's collection
   */
  async addWord(data: AddWordRequest): Promise<MyWord> {
    const response = await apiClient.post<ApiResponse<MyWord>>('/my-words', data);
    return response.data.data;
  }

  /**
   * Remove a word from the user's collection
   */
  async removeWord(id: string): Promise<void> {
    await apiClient.delete(`/my-words/${id}`);
  }

  /**
   * Update notes for a saved word
   */
  async updateNotes(id: string, notes: string): Promise<MyWord> {
    const response = await apiClient.patch<ApiResponse<MyWord>>(`/my-words/${id}`, { notes });
    return response.data.data;
  }

  /**
   * Search through user's saved words
   */
  async searchWords(query: string, page: number = 1, limit: number = 10): Promise<{ words: MyWord[]; pagination: PaginationMeta }> {
    const response = await apiClient.get<PaginatedResponse<MyWord>>('/my-words/search', {
      params: { query, page, limit },
    });
    return {
      words: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Get total count of saved words
   */
  async getWordCount(): Promise<number> {
    const response = await apiClient.get<ApiResponse<{ count: number }>>('/my-words/count');
    return response.data.data.count;
  }

  /**
   * Convert MyWord to SavedWord for Redux store compatibility
   */
  toSavedWord(myWord: MyWord): SavedWord {
    return {
      id: myWord.id,
      word: myWord.word,
      definition: myWord.definition,
      partOfSpeech: myWord.partOfSpeech || '',
      exampleSentence: myWord.exampleSentence || '',
      synonyms: myWord.synonyms || [],
      dateAdded: new Date(myWord.addedAt).getTime(),
    };
  }

  /**
   * Convert WordDefinition to AddWordRequest
   */
  toAddWordRequest(definition: WordDefinition, notes?: string): AddWordRequest {
    return {
      word: definition.word,
      notes,
    };
  }
}

const myWordsService = new MyWordsService();
export default myWordsService;
