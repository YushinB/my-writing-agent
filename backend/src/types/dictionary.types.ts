// Dictionary Entry Types

export interface Phonetic {
  text: string;
  audio?: string;
}

export interface Definition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
  synonyms?: string[];
  antonyms?: string[];
}

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics?: Phonetic[];
  meanings: Meaning[];
  origin?: string;
  sourceUrls?: string[];
}

// Free Dictionary API Response
export interface FreeDictionaryApiResponse {
  word: string;
  phonetic?: string;
  phonetics?: Array<{
    text?: string;
    audio?: string;
    sourceUrl?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
    synonyms?: string[];
    antonyms?: string[];
  }>;
  license?: {
    name: string;
    url: string;
  };
  sourceUrls?: string[];
  origin?: string;
}

// Database Dictionary Entry
export interface DictionaryEntryDb {
  id: string;
  word: string;
  phonetic: string | null;
  meanings: any; // JSON field
  origin: string | null;
  source: string;
  cachedAt: Date;
  lastAccessed: Date;
  accessCount: number;
  expiresAt: Date | null;
}

// Search request
export interface DictionarySearchRequest {
  query: string;
  limit?: number;
}

// Saved Word
export interface SavedWordRequest {
  word: string;
  notes?: string;
}

export interface SavedWordResponse {
  id: string;
  userId: string;
  word: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Paginated saved words
export interface SavedWordsResponse {
  words: SavedWordResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
