// Extend Express Request type to include user information

import { JwtPayload } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      userId?: string;
      userRole?: string;
    }
  }
}

export {};
