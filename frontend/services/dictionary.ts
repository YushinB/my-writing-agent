import { WordDefinition } from '../types';
import dictionaryApiService from './dictionaryApi';
import llmService from './llm';

class DictionaryService {
  /**
   * Look up a word definition using the backend API
   */
  async lookupWord(word: string): Promise<WordDefinition | null> {
    try {
      // Try backend dictionary API first
      const response = await dictionaryApiService.getWord(word);
      
      const definition: WordDefinition = {
        word: response.word,
        definition: response.definitions?.[0]?.definition || '',
        partOfSpeech: response.partOfSpeech || '',
        exampleSentence: response.definitions?.[0]?.example || '',
        synonyms: response.synonyms || [],
        pronunciation: response.pronunciation,
      };
      
      return definition;
    } catch (error) {
      console.error('Dictionary lookup error:', error);
      
      // Fallback to LLM define endpoint
      try {
        const llmResponse = await llmService.defineWord({ word });
        return llmService.toWordDefinition(llmResponse);
      } catch {
        return null;
      }
    }
  }

  /**
   * Get word suggestions for autocomplete
   */
  async getWordSuggestions(partial: string): Promise<string[]> {
    if (partial.length < 2) return [];

    try {
      // Search for words starting with the partial string
      const response = await dictionaryApiService.search(partial, 5);
      // Return the word if found, otherwise empty array
      return response?.word ? [response.word] : [];
    } catch (error) {
      console.error('Word suggestions error:', error);
      return [];
    }
  }

  /**
   * Look up a word from selected text in the editor
   */
  async lookupSelectedWord(selectedText: string): Promise<WordDefinition | null> {
    // Clean up the selected text (remove punctuation, extra spaces)
    const cleanWord = selectedText.trim().replace(/[^\w\s]/g, '').toLowerCase();

    // Only look up single words
    if (cleanWord.split(' ').length > 1) {
      return null;
    }

    return this.lookupWord(cleanWord);
  }
}

const dictionaryService = new DictionaryService();
export default dictionaryService;
