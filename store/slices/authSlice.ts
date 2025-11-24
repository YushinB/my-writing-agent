import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserRole } from '../../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  currentView: 'login' | 'writing' | 'admin';
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  currentView: 'login',
};

// Load from localStorage on initialization
const loadInitialState = (): AuthState => {
  try {
    const stored = localStorage.getItem('pp_user');
    if (stored) {
      const user = JSON.parse(stored);
      return {
        user,
        isAuthenticated: true,
        currentView: user.role === 'admin' ? 'admin' : 'writing',
      };
    }
  } catch (error) {
    console.error('Failed to load user from localStorage:', error);
  }
  return initialState;
};

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ email: string }>) => {
      const newUser: User = {
        id: crypto.randomUUID(),
        email: action.payload.email,
        name: action.payload.email.split('@')[0],
        role: action.payload.email.includes('admin') ? 'admin' : 'user',
      };
      
      state.user = newUser;
      state.isAuthenticated = true;
      state.currentView = newUser.role === 'admin' ? 'admin' : 'writing';
      
      // Persist to localStorage
      localStorage.setItem('pp_user', JSON.stringify(newUser));
    },
    
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.currentView = 'login';
      localStorage.removeItem('pp_user');
    },
    
    setCurrentView: (state, action: PayloadAction<'login' | 'writing' | 'admin'>) => {
      state.currentView = action.payload;
    },
  },
});

export const { loginSuccess, logout, setCurrentView } = authSlice.actions;
export default authSlice.reducer;
