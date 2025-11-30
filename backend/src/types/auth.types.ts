import { UserRole } from '@prisma/client';

// Registration request
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

// Login request
export interface LoginRequest {
  email: string;
  password: string;
}

// Token payload
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// Token pair
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Auth response
export interface AuthResponse {
  user: UserResponse;
  tokens: TokenPair;
}

// User response (without password)
export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Refresh token request
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Session data
export interface SessionData {
  userId: string;
  email: string;
  role: UserRole;
  createdAt: number;
  expiresAt: number;
}
