import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AppSettings, AppFont, AIModel } from '../../types';
import settingsService from '../../services/settings';

interface SettingsState extends AppSettings {
  isLoading: boolean;
  error: string | null;
  isSynced: boolean;
}

const loadInitialSettings = (): SettingsState => {
  try {
    const stored = localStorage.getItem('pp_settings');
    if (stored) {
      return {
        ...JSON.parse(stored),
        isLoading: false,
        error: null,
        isSynced: false,
      };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  
  return {
    fontFamily: 'inter',
    aiModel: 'gemini-2.5-flash',
    theme: 'light',
    isLoading: false,
    error: null,
    isSynced: false,
  };
};

// Async thunks
export const fetchSettings = createAsyncThunk(
  'settings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const settings = await settingsService.getSettings();
      return settingsService.toAppSettings(settings);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch settings';
      return rejectWithValue(message);
    }
  }
);

export const syncSettings = createAsyncThunk(
  'settings/sync',
  async (settings: Partial<AppSettings>, { rejectWithValue }) => {
    try {
      const request = settingsService.toUpdateRequest(settings);
      const updated = await settingsService.updateSettings(request);
      return settingsService.toAppSettings(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sync settings';
      return rejectWithValue(message);
    }
  }
);

export const resetSettingsToDefault = createAsyncThunk(
  'settings/reset',
  async (_, { rejectWithValue }) => {
    try {
      const settings = await settingsService.resetSettings();
      return settingsService.toAppSettings(settings);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reset settings';
      return rejectWithValue(message);
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState: loadInitialSettings(),
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      const newSettings = { ...state, ...action.payload };
      localStorage.setItem('pp_settings', JSON.stringify({
        fontFamily: newSettings.fontFamily,
        aiModel: newSettings.aiModel,
        theme: newSettings.theme,
      }));
      state.fontFamily = newSettings.fontFamily;
      state.aiModel = newSettings.aiModel;
      state.theme = newSettings.theme;
      state.isSynced = false;
    },
    
    toggleTheme: (state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      state.theme = newTheme;
      state.isSynced = false;
      localStorage.setItem('pp_settings', JSON.stringify({
        fontFamily: state.fontFamily,
        aiModel: state.aiModel,
        theme: state.theme,
      }));
      
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    
    setFontFamily: (state, action: PayloadAction<AppFont>) => {
      state.fontFamily = action.payload;
      state.isSynced = false;
      localStorage.setItem('pp_settings', JSON.stringify({
        fontFamily: state.fontFamily,
        aiModel: state.aiModel,
        theme: state.theme,
      }));
    },
    
    setAIModel: (state, action: PayloadAction<AIModel>) => {
      state.aiModel = action.payload;
      state.isSynced = false;
      localStorage.setItem('pp_settings', JSON.stringify({
        fontFamily: state.fontFamily,
        aiModel: state.aiModel,
        theme: state.theme,
      }));
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch settings
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.fontFamily = action.payload.fontFamily;
        state.aiModel = action.payload.aiModel;
        state.theme = action.payload.theme;
        state.isSynced = true;
        localStorage.setItem('pp_settings', JSON.stringify(action.payload));
        
        if (action.payload.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Sync settings
    builder
      .addCase(syncSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(syncSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.fontFamily = action.payload.fontFamily;
        state.aiModel = action.payload.aiModel;
        state.theme = action.payload.theme;
        state.isSynced = true;
        localStorage.setItem('pp_settings', JSON.stringify(action.payload));
      })
      .addCase(syncSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Reset settings
    builder
      .addCase(resetSettingsToDefault.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetSettingsToDefault.fulfilled, (state, action) => {
        state.isLoading = false;
        state.fontFamily = action.payload.fontFamily;
        state.aiModel = action.payload.aiModel;
        state.theme = action.payload.theme;
        state.isSynced = true;
        localStorage.setItem('pp_settings', JSON.stringify(action.payload));
        
        if (action.payload.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      })
      .addCase(resetSettingsToDefault.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateSettings, toggleTheme, setFontFamily, setAIModel, clearError } = settingsSlice.actions;
export default settingsSlice.reducer;
