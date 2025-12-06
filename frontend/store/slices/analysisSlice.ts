import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import llmService from '../../services/llm';
import geminiService from '../../services/gemini';
import { CorrectionResponse, LiveSuggestion, AIModel, WritingStyle } from '../../types';

interface AnalysisState {
  result: CorrectionResponse | null;
  liveSuggestion: LiveSuggestion | null;
  loading: boolean;
  error: string | null;
}

const initialState: AnalysisState = {
  result: null,
  liveSuggestion: null,
  loading: false,
  error: null,
};

// Async thunk for text analysis - uses backend API
export const analyzeText = createAsyncThunk(
  'analysis/analyzeText',
  async ({
    text,
    model,
    style,
  }: {
    text: string;
    model: AIModel;
    style: WritingStyle;
  }) => {
    // Try backend first, fallback to direct Gemini if not authenticated
    try {
      const response = await llmService.correctText({ text });
      // Transform backend response to match CorrectionResponse format
      const correctionResponse: CorrectionResponse = {
        correctedText: response.corrected,
        segments: [],
        explanation: response.corrections.map(c => c.explanation).join('. '),
        betterPhrasing: response.corrected,
        betterPhrasingExplanation: '',
        enhancedVocabulary: [],
        keyImprovements: response.corrections.map(c => `${c.type}: ${c.original} → ${c.corrected}`),
        ieltsAssessment: {
          overallBand: 0,
          criteria: [],
          generalFeedback: ''
        }
      };
      return correctionResponse;
    } catch {
      // Fallback to direct Gemini API if backend fails
      const response = await geminiService.analyzeText(text, model, style);
      return response;
    }
  }
);

// Async thunk for live suggestions - still uses direct Gemini for real-time performance
export const getLiveSuggestion = createAsyncThunk(
  'analysis/getLiveSuggestion',
  async ({ text, model }: { text: string; model: AIModel }) => {
    const response = await geminiService.getLiveSuggestion(text, model);
    return response;
  }
);

const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    clearResult: (state) => {
      state.result = null;
      state.error = null;
    },
    
    clearLiveSuggestion: (state) => {
      state.liveSuggestion = null;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Handle analyzeText
    builder
      .addCase(analyzeText.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.result = null;
      })
      .addCase(analyzeText.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload;
      })
      .addCase(analyzeText.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to analyze text';
      })
      // Handle getLiveSuggestion
      .addCase(getLiveSuggestion.fulfilled, (state, action) => {
        state.liveSuggestion = action.payload;
      })
      .addCase(getLiveSuggestion.rejected, (state) => {
        state.liveSuggestion = null;
      });
  },
});

export const { clearResult, clearLiveSuggestion, clearError } = analysisSlice.actions;
export default analysisSlice.reducer;
