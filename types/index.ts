
export interface TextSegment {
  text: string;
  isCorrection: boolean;
  originalText?: string;
  explanation?: string;
}

export interface VocabularyItem {
  term: string;
  type: 'word' | 'phrasal_verb' | 'idiom';
  definition: string;
  example: string;
}

export interface IeltsCriterion {
  name: string;
  score: number;
  feedback: string;
}

export interface IeltsAssessment {
  overallBand: number;
  criteria: IeltsCriterion[];
  generalFeedback: string;
}

export interface CorrectionResponse {
  correctedText: string;
  segments: TextSegment[];
  explanation: string;
  betterPhrasing: string;
  betterPhrasingExplanation: string;
  enhancedVocabulary: VocabularyItem[];
  keyImprovements: string[];
  ieltsAssessment: IeltsAssessment;
}

export interface WordDefinition {
  word: string;
  definition: string;
  partOfSpeech: string;
  exampleSentence: string;
  synonyms: string[];
}

export interface SavedWord extends WordDefinition {
  id: string;
  dateAdded: number;
}

export enum ViewMode {
  Write = 'write',
  Correct = 'correct',
  Dictionary = 'dictionary'
}

export interface TextSelection {
  text: string;
  context: string;
  range: Range;
  rect: DOMRect;
}

export interface LiveSuggestion {
  originalFragment: string;
  suggestion: string;
  type: 'correction' | 'completion' | 'refinement';
  reason: string;
}

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type AppFont = 'inter' | 'merriweather' | 'playfair' | 'roboto-mono';

export type AIModel = 'gemini-2.5-flash' | 'gemini-3-pro-preview';

export type WritingStyle = 'formal' | 'casual' | 'technical' | 'storytelling' | 'academic' | 'blog';

export interface AppSettings {
  fontFamily: AppFont;
  aiModel: AIModel;
  theme: 'light' | 'dark';
}
