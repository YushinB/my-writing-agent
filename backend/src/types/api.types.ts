// Generic API Response Types

// Success response wrapper
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

// Error response
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
  timestamp: string;
}

// Pagination metadata
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Paginated response
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  timestamp: string;
}

// Query parameters for pagination
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Search query parameters
export interface SearchQuery extends PaginationQuery {
  query: string;
}

// Common response messages
export enum ResponseMessage {
  SUCCESS = 'Operation completed successfully',
  CREATED = 'Resource created successfully',
  UPDATED = 'Resource updated successfully',
  DELETED = 'Resource deleted successfully',
  NOT_FOUND = 'Resource not found',
  UNAUTHORIZED = 'Authentication required',
  FORBIDDEN = 'Access denied',
  BAD_REQUEST = 'Invalid request',
  INTERNAL_ERROR = 'Internal server error',
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  services: {
    database: boolean;
    redis: boolean;
    geminiAi?: boolean;
  };
  version: string;
}
