import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SavedWord, WordDefinition } from '../../types';
import myWordsService from '../../services/myWords';
import dictionaryApiService from '../../services/dictionaryApi';

interface DictionaryState {
  words: SavedWord[];
  isOpen: boolean;
  isMyWordsOpen: boolean;
  currentDefinition: WordDefinition | null;
  isDefining: boolean;
  isLoading: boolean;
  error: string | null;
  recentLookups: WordDefinition[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

const initialState: DictionaryState = {
  words: [],
  isOpen: false,
  isMyWordsOpen: false,
  currentDefinition: null,
  isDefining: false,
  isLoading: false,
  error: null,
  recentLookups: [],
  pagination: null,
};

// Async thunks for backend integration
export const fetchSavedWords = createAsyncThunk(
  'dictionary/fetchSavedWords',
  async ({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await myWordsService.getWords(page, limit);
      return {
        words: response.words.map(myWordsService.toSavedWord),
        pagination: response.pagination,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch words';
      return rejectWithValue(message);
    }
  }
);

export const saveWordToBackend = createAsyncThunk(
  'dictionary/saveWord',
  async ({ word, notes }: { word: string; notes?: string }, { rejectWithValue }) => {
    try {
      const response = await myWordsService.addWord({ word, notes });
      return myWordsService.toSavedWord(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save word';
      return rejectWithValue(message);
    }
  }
);

export const removeWordFromBackend = createAsyncThunk(
  'dictionary/removeWord',
  async (id: string, { rejectWithValue }) => {
    try {
      await myWordsService.removeWord(id);
      return id;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove word';
      return rejectWithValue(message);
    }
  }
);

export const searchSavedWords = createAsyncThunk(
  'dictionary/searchWords',
  async ({ query, page = 1, limit = 20 }: { query: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await myWordsService.searchWords(query, page, limit);
      return {
        words: response.words.map(myWordsService.toSavedWord),
        pagination: response.pagination,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to search words';
      return rejectWithValue(message);
    }
  }
);

export const lookupWordDefinition = createAsyncThunk(
  'dictionary/lookupWord',
  async (word: string, { rejectWithValue }) => {
    try {
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to lookup word';
      return rejectWithValue(message);
    }
  }
);

const dictionarySlice = createSlice({
  name: 'dictionary',
  initialState,
  reducers: {
    openDictionary: (state) => {
      state.isOpen = true;
      state.isMyWordsOpen = false;
    },
    
    closeDictionary: (state) => {
      state.isOpen = false;
    },
    
    openMyWords: (state) => {
      state.isMyWordsOpen = true;
      state.isOpen = false;
    },
    
    closeMyWords: (state) => {
      state.isMyWordsOpen = false;
    },
    
    setCurrentDefinition: (state, action: PayloadAction<WordDefinition | null>) => {
      state.currentDefinition = action.payload;
    },
    
    setIsDefining: (state, action: PayloadAction<boolean>) => {
      state.isDefining = action.payload;
    },
    
    clearCurrentDefinition: (state) => {
      state.currentDefinition = null;
    },
    
    addToRecentLookups: (state, action: PayloadAction<WordDefinition>) => {
      const exists = state.recentLookups.some(w => w.word === action.payload.word);
      if (!exists) {
        state.recentLookups = [action.payload, ...state.recentLookups.slice(0, 9)];
      }
    },
    
    clearRecentLookups: (state) => {
      state.recentLookups = [];
    },
    
    clearError: (state) => {
      state.error = null;
    },

    updateWordInStore: (state, action: PayloadAction<{ id: string; notes?: string; tags?: string[]; favorite?: boolean }>) => {
      const word = state.words.find(w => w.id === action.payload.id);
      if (word) {
        if (action.payload.notes !== undefined) {
          word.notes = action.payload.notes;
        }
        if (action.payload.tags !== undefined) {
          word.tags = action.payload.tags;
        }
        if (action.payload.favorite !== undefined) {
          word.favorite = action.payload.favorite;
        }
      }
    },

    toggleFavoriteInStore: (state, action: PayloadAction<{ id: string; favorite: boolean }>) => {
      const word = state.words.find(w => w.id === action.payload.id);
      if (word) {
        word.favorite = action.payload.favorite;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch saved words
    builder
      .addCase(fetchSavedWords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSavedWords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.words = action.payload.words;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchSavedWords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Save word
    builder
      .addCase(saveWordToBackend.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveWordToBackend.fulfilled, (state, action) => {
        state.isLoading = false;
        state.words.push(action.payload);
      })
      .addCase(saveWordToBackend.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Remove word
    builder
      .addCase(removeWordFromBackend.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeWordFromBackend.fulfilled, (state, action) => {
        state.isLoading = false;
        state.words = state.words.filter(word => word.id !== action.payload);
      })
      .addCase(removeWordFromBackend.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Search words
    builder
      .addCase(searchSavedWords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchSavedWords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.words = action.payload.words;
        state.pagination = action.payload.pagination;
      })
      .addCase(searchSavedWords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Lookup word definition
    builder
      .addCase(lookupWordDefinition.pending, (state) => {
        state.isDefining = true;
        state.error = null;
      })
      .addCase(lookupWordDefinition.fulfilled, (state, action) => {
        state.isDefining = false;
        state.currentDefinition = action.payload;
      })
      .addCase(lookupWordDefinition.rejected, (state, action) => {
        state.isDefining = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  openDictionary,
  closeDictionary,
  openMyWords,
  closeMyWords,
  setCurrentDefinition,
  setIsDefining,
  clearCurrentDefinition,
  addToRecentLookups,
  clearRecentLookups,
  clearError,
  updateWordInStore,
  toggleFavoriteInStore,
} = dictionarySlice.actions;

export default dictionarySlice.reducer;
