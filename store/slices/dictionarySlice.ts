import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SavedWord, WordDefinition } from '../../types';

interface DictionaryState {
  words: SavedWord[];
  isOpen: boolean;
  currentDefinition: WordDefinition | null;
  isDefining: boolean;
}

const loadSavedWords = (): SavedWord[] => {
  try {
    const saved = localStorage.getItem('prosepolish_dictionary');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load dictionary:', error);
    return [];
  }
};

const initialState: DictionaryState = {
  words: loadSavedWords(),
  isOpen: false,
  currentDefinition: null,
  isDefining: false,
};

const dictionarySlice = createSlice({
  name: 'dictionary',
  initialState,
  reducers: {
    addWord: (state, action: PayloadAction<WordDefinition>) => {
      const newWord: SavedWord = {
        ...action.payload,
        id: crypto.randomUUID(),
        dateAdded: Date.now(),
      };
      state.words.push(newWord);
      localStorage.setItem('prosepolish_dictionary', JSON.stringify(state.words));
    },
    
    removeWord: (state, action: PayloadAction<string>) => {
      state.words = state.words.filter(word => word.id !== action.payload);
      localStorage.setItem('prosepolish_dictionary', JSON.stringify(state.words));
    },
    
    openDictionary: (state) => {
      state.isOpen = true;
    },
    
    closeDictionary: (state) => {
      state.isOpen = false;
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
  },
});

export const {
  addWord,
  removeWord,
  openDictionary,
  closeDictionary,
  setCurrentDefinition,
  setIsDefining,
  clearCurrentDefinition,
} = dictionarySlice.actions;

export default dictionarySlice.reducer;
