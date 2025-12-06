import apiClient, { ApiResponse, tokenStorage, getErrorMessage } from './api';

// Auth types matching backend API
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    const { user, accessToken, refreshToken } = response.data.data;
    
    // Store tokens
    tokenStorage.setTokens(accessToken, refreshToken);
    
    return { user, accessToken, refreshToken };
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    const { user, accessToken, refreshToken } = response.data.data;
    
    // Store tokens
    tokenStorage.setTokens(accessToken, refreshToken);
    
    return { user, accessToken, refreshToken };
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<RefreshResponse> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<ApiResponse<RefreshResponse>>('/auth/refresh', {
      refreshToken,
    });
    
    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    tokenStorage.setTokens(accessToken, newRefreshToken);
    
    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout current session
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      tokenStorage.clearTokens();
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(): Promise<void> {
    try {
      await apiClient.post('/auth/logout-all');
    } finally {
      tokenStorage.clearTokens();
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
    return response.data.data;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenStorage.hasTokens();
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return tokenStorage.getAccessToken();
  }
}

const authService = new AuthService();
export default authService;
export { getErrorMessage };
