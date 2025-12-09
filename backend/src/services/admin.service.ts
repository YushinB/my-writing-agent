import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import redisClient from '../config/redis';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors';
import {
  GetUsersRequest,
  UserListResponse,
  SystemStatus,
  AuditLogEntry,
  AuditLogResponse,
  CreateUserRequest,
} from '../types/admin.types';

export class AdminService {
  /**
   * Get paginated list of users with optional filters
   */
  async getUserList(params: GetUsersRequest): Promise<UserListResponse> {
    const { page = 1, limit = 10, search, role, suspended } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.role = role;
    }
    if (suspended !== undefined) {
      where.suspended = suspended;
    }

    // Get users with counts
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          suspended: true,
          suspendedAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              savedWords: true,
              aiUsageLogs: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Transform users to response format
    const transformedUsers = users.map((user) => ({
      ...user,
      role: user.role.toLowerCase() as 'user' | 'admin',
    }));

    return {
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Suspend a user account
   */
  async suspendUser(userId: string, reason: string | undefined, actorId: string): Promise<void> {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if already suspended
    if (user.suspended) {
      throw new BadRequestError('User is already suspended');
    }

    // Update user and create audit log in transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          suspended: true,
          suspendedAt: new Date(),
          suspendedBy: actorId,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId,
          targetId: userId,
          action: 'USER_SUSPENDED',
          details: reason ? { reason } : undefined,
        },
      }),
    ]);
  }

  /**
   * Enable a suspended user account
   */
  async enableUser(userId: string, actorId: string): Promise<void> {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if suspended
    if (!user.suspended) {
      throw new BadRequestError('User is not suspended');
    }

    // Update user and create audit log in transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          suspended: false,
          suspendedAt: null,
          suspendedBy: null,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId,
          targetId: userId,
          action: 'USER_ENABLED',
          details: undefined,
        },
      }),
    ]);
  }

  /**
   * Change a user's role
   */
  async changeUserRole(userId: string, newRole: UserRole, actorId: string): Promise<void> {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if role is already the same
    if (user.role === newRole) {
      throw new BadRequestError(`User already has role: ${newRole}`);
    }

    // Update user and create audit log in transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
      }),
      prisma.auditLog.create({
        data: {
          actorId,
          targetId: userId,
          action: 'USER_ROLE_CHANGED',
          details: {
            oldRole: user.role,
            newRole,
          },
        },
      }),
    ]);
  }

  /**
   * Get system status including database, redis, and statistics
   */
  async getSystemStatus(): Promise<SystemStatus> {


    // Check database connection
    let dbConnected = false;
    let dbResponseTime: number | undefined;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
      dbConnected = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Check Redis connection
    let redisConnected = false;
    let redisResponseTime: number | undefined;
    try {
      const redisStart = Date.now();
      await redisClient.ping();
      redisResponseTime = Date.now() - redisStart;
      redisConnected = true;
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    // Get statistics
    const [totalUsers, suspendedUsers, totalApiCalls] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { suspended: true } }),
      prisma.aIUsageLog.count(),
    ]);

    // Calculate active users (users who have made API calls in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await prisma.user.count({
      where: {
        aiUsageLogs: {
          some: {
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
        },
      },
    });

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'down';
    if (dbConnected && redisConnected) {
      status = 'healthy';
    } else if (dbConnected || redisConnected) {
      status = 'degraded';
    } else {
      status = 'down';
    }

    return {
      status,
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      database: {
        connected: dbConnected,
        responseTime: dbResponseTime,
      },
      redis: {
        connected: redisConnected,
        responseTime: redisResponseTime,
      },
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalApiCalls,
      },
    };
  }

  /**
   * Get audit logs with pagination
   */
  async getAuditLogs(page = 1, limit = 50): Promise<AuditLogResponse> {
    // Normalize and validate pagination inputs to avoid negative skip values
    page = Number(page) || 1;
    limit = Number(limit) || 50;
    if (page < 1) page = 1;
    if (limit < 1) limit = 50;
    const skip = Math.max(0, (page - 1) * limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              email: true,
            },
          },
          target: {
            select: {
              email: true,
            },
          },
        },
      }),
      prisma.auditLog.count(),
    ]);

    const transformedLogs: AuditLogEntry[] = logs.map((log) => ({
      id: log.id,
      actorId: log.actorId,
      actorEmail: log.actor.email,
      targetId: log.targetId,
      targetEmail: log.target?.email || null,
      action: log.action,
      details: log.details as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    }));

    return {
      logs: transformedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create an audit log entry (for manual logging from other services)
   */
  async createAuditLog(
    action: string,
    actorId: string,
    targetId: string | null = null,
    details: Record<string, unknown> | null = null,
    ipAddress: string | null = null
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        actorId,
        targetId,
        action,
        details: details as any || undefined,
        ipAddress,
      },
    });
  }

  /**
   * Create a new user (admin function)
   */
  async createUser(
    data: CreateUserRequest,
    actorId: string
  ): Promise<{ id: string; email: string; name: string; role: UserRole }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Validate password strength
    if (data.password.length < 8) {
      throw new BadRequestError('Password must be at least 8 characters long');
    }

    // Hash password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role || UserRole.USER,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Create default settings
    await prisma.userSettings.create({
      data: {
        userId: user.id,
      },
    });

    // Create audit log
    await this.createAuditLog(
      'USER_CREATED',
      actorId,
      user.id,
      {
        email: user.email,
        role: user.role,
      }
    );

    return {
      ...user,
      name: user.name || data.name, // Use provided name if Prisma returns null
    };
  }

  /**
   * Delete a user (admin function)
   */
  async deleteUser(userId: string, actorId: string): Promise<void> {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Prevent deleting the last admin
    if (user.role === UserRole.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: UserRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestError('Cannot delete the last admin user');
      }
    }

    // Prevent self-deletion
    if (userId === actorId) {
      throw new BadRequestError('Cannot delete your own account');
    }

    // Create audit log before deletion
    await this.createAuditLog(
      'USER_DELETED',
      actorId,
      userId,
      {
        email: user.email,
        role: user.role,
      }
    );

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });
  }
}

export const adminService = new AdminService();
