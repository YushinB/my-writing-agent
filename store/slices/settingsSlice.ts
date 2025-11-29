import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppSettings, AppFont, AIModel } from '../../types';

const loadInitialSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem('pp_settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  
  return {
    fontFamily: 'inter',
    aiModel: 'gemini-2.5-flash',
    theme: 'light',
  };
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: loadInitialSettings(),
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      const newSettings = { ...state, ...action.payload };
      localStorage.setItem('pp_settings', JSON.stringify(newSettings));
      return newSettings;
    },
    
    toggleTheme: (state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      state.theme = newTheme;
      localStorage.setItem('pp_settings', JSON.stringify(state));
      
      // Apply theme to DOM
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      console.log(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme applied`);
    },
    
    setFontFamily: (state, action: PayloadAction<AppFont>) => {
      state.fontFamily = action.payload;
      localStorage.setItem('pp_settings', JSON.stringify(state));
    },
    
    setAIModel: (state, action: PayloadAction<AIModel>) => {
      state.aiModel = action.payload;
      localStorage.setItem('pp_settings', JSON.stringify(state));
    },
  },
});

export const { updateSettings, toggleTheme, setFontFamily, setAIModel } = settingsSlice.actions;
export default settingsSlice.reducer;
