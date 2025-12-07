import apiClient from './api';

export interface UserListItem {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
  suspended: boolean;
  suspendedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    savedWords: number;
    aiUsageLogs: number;
  };
}

export interface UserListResponse {
  users: UserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'ADMIN' | 'USER';
  suspended?: boolean;
}

export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'down';
  version: string;
  uptime: number;
  database: {
    connected: boolean;
    responseTime?: number;
  };
  redis: {
    connected: boolean;
    responseTime?: number;
  };
  stats: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    totalApiCalls: number;
  };
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  targetId: string | null;
  targetEmail: string | null;
  action: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get list of users with pagination and filters
 */
export const getUserList = async (params?: GetUsersParams): Promise<UserListResponse> => {
  const response = await apiClient.get<UserListResponse>('/admin/users', { params });
  return response.data;
};

/**
 * Suspend a user account
 */
export const suspendUser = async (userId: string, reason?: string): Promise<void> => {
  await apiClient.put(`/admin/users/${userId}/suspend`, { reason });
};

/**
 * Enable a suspended user account
 */
export const enableUser = async (userId: string): Promise<void> => {
  await apiClient.put(`/admin/users/${userId}/enable`);
};

/**
 * Change a user's role
 */
export const changeUserRole = async (userId: string, role: 'ADMIN' | 'USER'): Promise<void> => {
  await apiClient.put(`/admin/users/${userId}/role`, { role });
};

/**
 * Get system health and statistics
 */
export const getSystemStatus = async (): Promise<SystemStatus> => {
  const response = await apiClient.get<SystemStatus>('/admin/system/status');
  return response.data;
};

/**
 * Get audit logs with pagination
 */
export const getAuditLogs = async (page = 1, limit = 50): Promise<AuditLogResponse> => {
  const response = await apiClient.get<AuditLogResponse>('/admin/audit-logs', {
    params: { page, limit },
  });
  return response.data;
};
