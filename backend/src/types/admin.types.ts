import { UserRole } from '@prisma/client';

// Admin user list request
export interface GetUsersRequest {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  suspended?: boolean;
}

// Update user request
export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

// Change user role request
export interface ChangeUserRoleRequest {
  role: UserRole;
}

// Suspend user request
export interface SuspendUserRequest {
  reason?: string;
}

// Create user request
export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}

// Reset password request
export interface ResetPasswordRequest {
  newPassword: string;
}

// User list response
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

// System status response
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

// Audit log entry
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
