import type { UserRole } from '@student-rental/contracts';

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: UserRole };
    }
  }
}

export {};

