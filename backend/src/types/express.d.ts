import { User, UserRole, AIQuota } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
      userRole?: UserRole;
      aiQuota?: AIQuota;
    }
  }
}

export {};
