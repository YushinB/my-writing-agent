import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TextSelection, WritingStyle } from '../../types';

interface EditorState {
  inputText: string;
  selectedStyle: WritingStyle;
  activeTab: 'correction' | 'better';
  liveMode: boolean;
  selection: TextSelection | null;
}

const initialState: EditorState = {
  inputText: '',
  selectedStyle: 'formal',
  activeTab: 'correction',
  liveMode: false,
  selection: null,
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setInputText: (state, action: PayloadAction<string>) => {
      state.inputText = action.payload;
    },
    
    clearInputText: (state) => {
      state.inputText = '';
    },
    
    setSelectedStyle: (state, action: PayloadAction<WritingStyle>) => {
      state.selectedStyle = action.payload;
    },
    
    setActiveTab: (state, action: PayloadAction<'correction' | 'better'>) => {
      state.activeTab = action.payload;
    },
    
    toggleLiveMode: (state) => {
      state.liveMode = !state.liveMode;
    },
    
    setLiveMode: (state, action: PayloadAction<boolean>) => {
      state.liveMode = action.payload;
    },
    
    setSelection: (state, action: PayloadAction<TextSelection | null>) => {
      // Use type assertion since TextSelection contains non-serializable DOM objects
      // This is handled by serializableCheck ignore in store configuration
      state.selection = action.payload as typeof state.selection;
    },
    
    clearSelection: (state) => {
      state.selection = null;
    },
  },
});

export const {
  setInputText,
  clearInputText,
  setSelectedStyle,
  setActiveTab,
  toggleLiveMode,
  setLiveMode,
  setSelection,
  clearSelection,
} = editorSlice.actions;

export default editorSlice.reducer;
