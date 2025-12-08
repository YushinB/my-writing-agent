import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';
import authService, { AuthUser, LoginRequest, RegisterRequest } from '../../services/auth';
import { tokenStorage } from '../../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  currentView: 'login' | 'writing' | 'admin' | 'profile';
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  currentView: 'login',
};

// Convert AuthUser to User
const toUser = (authUser: AuthUser): User => ({
  id: authUser.id,
  email: authUser.email,
  name: authUser.name,
  displayName: authUser.displayName,
  avatar: authUser.avatar,
  hobbies: authUser.hobbies,
  role: authUser.role,
});

// Load from localStorage on initialization
const loadInitialState = (): AuthState => {
  try {
    const stored = localStorage.getItem('pp_user');
    const hasTokens = tokenStorage.hasTokens();
    
    if (stored && hasTokens) {
      const user = JSON.parse(stored);
      return {
        ...initialState,
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

// Async thunks
export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authService.register(data);
      return toUser(response.user);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (data: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(data);
      return toUser(response.user);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return undefined;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      return rejectWithValue(message);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getCurrentUser();
      return toUser(user);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch user';
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.currentView = 'login';
      state.error = null;
      localStorage.removeItem('pp_user');
      tokenStorage.clearTokens();
    },
    
    setCurrentView: (state, action: PayloadAction<'login' | 'writing' | 'admin' | 'profile'>) => {
      state.currentView = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },

    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('pp_user', JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.currentView = action.payload.role === 'admin' ? 'admin' : 'writing';
        localStorage.setItem('pp_user', JSON.stringify(action.payload));
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.currentView = action.payload.role === 'admin' ? 'admin' : 'writing';
        localStorage.setItem('pp_user', JSON.stringify(action.payload));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    
    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.currentView = 'login';
        localStorage.removeItem('pp_user');
      });
    
    // Fetch current user
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        localStorage.setItem('pp_user', JSON.stringify(action.payload));
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.currentView = 'login';
        localStorage.removeItem('pp_user');
        tokenStorage.clearTokens();
      });
  },
});

export const { logout, setCurrentView, clearError, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;
