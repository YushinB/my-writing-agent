// API client and utilities
export { default as apiClient, tokenStorage, getErrorMessage } from './api';
export type { ApiResponse, ApiError, PaginationMeta, PaginatedResponse } from './api';

// Auth service
export { default as authService } from './auth';
export type { AuthUser, LoginRequest, RegisterRequest, AuthResponse, RefreshResponse } from './auth';

// Dictionary API service (backend)
export { default as dictionaryApiService } from './dictionaryApi';
export type { DictionaryWord, DictionaryDefinition, FullWordData, PopularWord, SearchResult } from './dictionaryApi';

// My Words service
export { default as myWordsService } from './myWords';
export type { MyWord, AddWordRequest, UpdateNotesRequest } from './myWords';

// LLM service
export { default as llmService } from './llm';
export type {
  CorrectTextRequest,
  CorrectTextResponse,
  Correction,
  Alternative,
  DefineWordRequest,
  DefineWordResponse,
  SuggestionRequest,
  SuggestionResponse,
  Suggestion,
  AnalyzeRequest,
  AnalyzeResponse,
  WritingAnalysis,
} from './llm';

// Settings service
export { default as settingsService } from './settings';
export type { UserSettings, UpdateSettingsRequest } from './settings';

// Profile service
export { default as profileService } from './profile';
export type { ProfileResponse } from './profile';

// Legacy services (direct Gemini API - for backwards compatibility)
export { default as geminiService, analyzeText, defineWord, getLiveSuggestion } from './gemini';
export { default as dictionaryService } from './dictionary';
