import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import settingsReducer from './slices/settingsSlice';
import editorReducer from './slices/editorSlice';
import dictionaryReducer from './slices/dictionarySlice';
import analysisReducer from './slices/analysisSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    editor: editorReducer,
    dictionary: dictionaryReducer,
    analysis: analysisReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['editor/setSelection'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.range', 'payload.rect'],
        // Ignore these paths in the state
        ignoredPaths: ['editor.selection'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for Redux
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
