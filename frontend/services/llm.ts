import apiClient, { ApiResponse } from './api';
import { WordDefinition } from '../types';

// LLM types matching backend API
export interface Correction {
  original: string;
  corrected: string;
  type: 'grammar' | 'spelling' | 'punctuation' | 'style';
  explanation: string;
}

export interface Alternative {
  original: string;
  alternative: string;
  improvement: string;
}

export interface CorrectTextRequest {
  text: string;
  context?: string;
  options?: {
    preserveFormatting?: boolean;
    suggestAlternatives?: boolean;
  };
}

export interface CorrectTextResponse {
  original: string;
  corrected: string;
  corrections: Correction[];
  alternatives?: Alternative[];
}

export interface DefineWordRequest {
  word: string;
  context?: string;
}

export interface DefineWordResponse {
  word: string;
  definition: string;
  pronunciation?: string;
  partOfSpeech?: string;
  examples?: string[];
  synonyms?: string[];
  etymology?: string;
  contextualUsage?: string;
}

export interface SuggestionRequest {
  text: string;
  type: 'paraphrase' | 'expand' | 'summarize' | 'improve';
  count?: number;
}

export interface Suggestion {
  suggestion: string;
  confidence: number;
  explanation: string;
}

export interface SuggestionResponse {
  original: string;
  type: string;
  suggestions: Suggestion[];
}

export interface AnalyzeRequest {
  text: string;
}

export interface ReadabilityScore {
  score: number;
  level: string;
  description: string;
}

export interface ClarityScore {
  score: number;
  issues: string[];
}

export interface StyleAnalysis {
  activeVoice: number;
  passiveVoice: number;
  averageSentenceLength: number;
  wordVariety: string;
}

export interface EngagementScore {
  score: number;
  suggestions: string[];
}

export interface WritingAnalysis {
  tone: string;
  readability: ReadabilityScore;
  clarity: ClarityScore;
  style: StyleAnalysis;
  engagement: EngagementScore;
}

export interface Improvement {
  issue: string;
  suggestion: string;
}

export interface AnalyzeResponse {
  analysis: WritingAnalysis;
  strengths: string[];
  improvements: Improvement[];
  recommendations: string[];
}

class LLMService {
  /**
   * Correct text using AI
   */
  async correctText(data: CorrectTextRequest): Promise<CorrectTextResponse> {
    const response = await apiClient.post<ApiResponse<CorrectTextResponse>>('/llm/correct', data);
    return response.data.data;
  }

  /**
   * Define a word using AI
   */
  async defineWord(data: DefineWordRequest): Promise<DefineWordResponse> {
    const response = await apiClient.post<ApiResponse<DefineWordResponse>>('/llm/define', data);
    return response.data.data;
  }

  /**
   * Generate text suggestions
   */
  async getSuggestions(data: SuggestionRequest): Promise<SuggestionResponse> {
    const response = await apiClient.post<ApiResponse<SuggestionResponse>>('/llm/suggestions', data);
    return response.data.data;
  }

  /**
   * Analyze writing style
   */
  async analyzeWriting(data: AnalyzeRequest): Promise<AnalyzeResponse> {
    const response = await apiClient.post<ApiResponse<AnalyzeResponse>>('/llm/analyze', data);
    return response.data.data;
  }

  /**
   * Convert DefineWordResponse to WordDefinition for compatibility
   */
  toWordDefinition(response: DefineWordResponse): WordDefinition {
    return {
      word: response.word,
      definition: response.definition,
      partOfSpeech: response.partOfSpeech || '',
      exampleSentence: response.examples?.[0] || '',
      synonyms: response.synonyms || [],
    };
  }
}

const llmService = new LLMService();
export default llmService;
