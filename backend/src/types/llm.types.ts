// LLM Request and Response Types

// Text correction request
export interface CorrectTextRequest {
  text: string;
  context?: string;
  options?: {
    preserveFormatting?: boolean;
    suggestAlternatives?: boolean;
  };
}

// Text correction response
export interface CorrectTextResponse {
  originalText: string;
  correctedText: string;
  changes: TextChange[];
  suggestions?: string[];
  cached?: boolean;
}

// Individual text change
export interface TextChange {
  type: 'spelling' | 'grammar' | 'punctuation' | 'style' | 'other';
  original: string;
  corrected: string;
  position?: {
    start: number;
    end: number;
  };
  explanation?: string;
}

// Define word request
export interface DefineWordRequest {
  word: string;
  context?: string;
}

// Define word response
export interface DefineWordResponse {
  word: string;
  definition: string;
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
  partOfSpeech?: string;
  cached?: boolean;
}

// Generate suggestions request
export interface GenerateSuggestionsRequest {
  text: string;
  type: 'paraphrase' | 'expand' | 'summarize' | 'improve';
  count?: number;
}

// Generate suggestions response
export interface GenerateSuggestionsResponse {
  originalText: string;
  suggestions: string[];
  type: string;
  cached?: boolean;
}

// Analyze writing style request
export interface AnalyzeWritingStyleRequest {
  text: string;
}

// Analyze writing style response
export interface AnalyzeWritingStyleResponse {
  text: string;
  analysis: {
    tone: string;
    readabilityScore: number;
    wordCount: number;
    sentenceCount: number;
    averageWordsPerSentence: number;
    complexWords: number;
    suggestions: string[];
  };
  cached?: boolean;
}

// AI Usage Log
export interface AIUsageLogData {
  userId: string;
  operation: 'correct_text' | 'define_word' | 'generate_suggestions' | 'analyze_style';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  cached: boolean;
  costEstimate?: number;
}

// Gemini API Response (simplified)
export interface GeminiResponse {
  text: string;
  finishReason?: string;
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
}
