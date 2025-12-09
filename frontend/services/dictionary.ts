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

      // Transform the backend response which has a 'meanings' array structure
      // to the frontend's flattened WordDefinition structure
      const firstMeaning = (response as any).meanings?.[0];
      const firstDefinition = firstMeaning?.definitions?.[0];

      // Collect all synonyms from all meanings
      const allSynonyms: string[] = [];
      if ((response as any).meanings) {
        (response as any).meanings.forEach((meaning: any) => {
          if (meaning.synonyms) allSynonyms.push(...meaning.synonyms);
          meaning.definitions?.forEach((def: any) => {
            if (def.synonyms) allSynonyms.push(...def.synonyms);
          });
        });
      }

      const definition: WordDefinition = {
        word: response.word,
        definition: firstDefinition?.definition || '',
        partOfSpeech: firstMeaning?.partOfSpeech || '',
        exampleSentence: firstDefinition?.example || '',
        synonyms: allSynonyms.length > 0 ? [...new Set(allSynonyms)] : [],
        pronunciation: (response as any).phonetic || response.pronunciation,
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
    // Clean up the selected text (remove extra spaces and trim)
    const cleanWord = selectedText.trim().replace(/\s+/g, ' ').toLowerCase();

    // Allow up to 3 words (to support phrases like "take off", "give up", etc.)
    if (cleanWord.split(' ').length > 3) {
      return null;
    }

    return this.lookupWord(cleanWord);
  }
}

const dictionaryService = new DictionaryService();
export default dictionaryService;
