import { WordDefinition } from '../types';
import geminiService from './gemini';

class DictionaryService {
  /**
   * Look up a word definition using the Gemini API
   */
  async lookupWord(word: string): Promise<WordDefinition | null> {
    try {
      const prompt = `Define the word "${word}" in a clear and concise way. Provide the following information in JSON format:
{
  "word": "${word}",
  "definition": "A clear, simple definition",
  "partOfSpeech": "noun/verb/adjective/etc",
  "exampleSentence": "A natural example sentence using the word",
  "synonyms": ["synonym1", "synonym2", "synonym3"]
}

Return ONLY the JSON object, nothing else.`;

      const response = await geminiService.generateText(prompt, 'gemini-2.5-flash');

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const definition: WordDefinition = JSON.parse(jsonMatch[0]);
      return definition;
    } catch (error) {
      console.error('Dictionary lookup error:', error);
      return null;
    }
  }

  /**
   * Get word suggestions for autocomplete
   */
  async getWordSuggestions(partial: string): Promise<string[]> {
    if (partial.length < 2) return [];

    try {
      const prompt = `Suggest 5 English words that start with "${partial}". Return only a JSON array of words, nothing else. Example: ["word1", "word2", "word3", "word4", "word5"]`;

      const response = await geminiService.generateText(prompt, 'gemini-2.5-flash');

      // Extract JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      const suggestions: string[] = JSON.parse(jsonMatch[0]);
      return suggestions.slice(0, 5);
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
