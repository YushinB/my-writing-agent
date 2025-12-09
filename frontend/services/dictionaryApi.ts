import apiClient, { ApiResponse } from './api';

// Dictionary types matching backend API
export interface DictionaryDefinition {
  definition: string;
  example?: string;
}

export interface DictionaryWord {
  word: string;
  pronunciation?: string;
  partOfSpeech?: string;
  definitions: DictionaryDefinition[];
  synonyms?: string[];
  antonyms?: string[];
  frequency?: string;
  etymology?: string;
}

export interface FullWordData extends DictionaryWord {
  relatedWords?: string[];
  metadata?: {
    queriedAt: string;
    word: string;
  };
}

export interface PopularWord {
  word: string;
  definition: string;
  frequency: number;
}

export interface SearchResult {
  word: string;
  pronunciation?: string;
  partOfSpeech?: string;
  definitions: DictionaryDefinition[];
  synonyms?: string[];
  antonyms?: string[];
  frequency?: string;
}

class DictionaryApiService {
  /**
   * Search for a word in the dictionary
   */
  async search(query: string, limit: number = 10): Promise<SearchResult> {
    const response = await apiClient.get<ApiResponse<SearchResult>>('/dictionary/search', {
      params: { query, limit },
    });
    return response.data.data;
  }

  /**
   * Get word definition
   */
  async getWord(word: string): Promise<DictionaryWord> {
    const response = await apiClient.get<ApiResponse<DictionaryWord>>(`/dictionary/word/${encodeURIComponent(word)}`);
    return response.data.data;
  }

  /**
   * Get full word data including metadata
   */
  async getFullWordData(word: string): Promise<FullWordData> {
    const response = await apiClient.get<ApiResponse<FullWordData>>(`/dictionary/word/${encodeURIComponent(word)}/full`);
    return response.data.data;
  }

  /**
   * Get popular words
   */
  async getPopularWords(limit: number = 10): Promise<PopularWord[]> {
    const response = await apiClient.get<ApiResponse<{ words: PopularWord[] }>>('/dictionary/popular', {
      params: { limit },
    });
    return response.data.data.words;
  }

  /**
   * Add word to dictionary (admin only)
   */
  async addWord(wordData: {
    word: string;
    pronunciation?: string;
    partOfSpeech?: string;
    definitions?: DictionaryDefinition[];
    synonyms?: string[];
    etymology?: string;
  }): Promise<void> {
    await apiClient.post('/dictionary/words', wordData);
  }

  /**
   * Refresh cache for a word (admin only)
   */
  async refreshCache(word: string): Promise<{ word: string; cacheRefreshedAt: string; cacheExpiresAt: string }> {
    const response = await apiClient.post<ApiResponse<{ word: string; cacheRefreshedAt: string; cacheExpiresAt: string }>>(
      `/dictionary/word/${encodeURIComponent(word)}/refresh`
    );
    return response.data.data;
  }
}

const dictionaryApiService = new DictionaryApiService();
export default dictionaryApiService;
