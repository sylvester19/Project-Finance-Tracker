import { UserRoleType } from '@shared/schema';

declare module 'express-session' {
  interface SessionData {
    userId: number;
    role: UserRoleType;
    sessionToken: string; 
  }
}

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      role?: UserRoleType;
    }
  }
}