/**
 * GraphQL Context
 */

import { YogaInitialContext } from 'graphql-yoga';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '@/types';
import logger from '@/utils/logger';

export interface GraphQLContext extends YogaInitialContext {
  userId?: string;
  userRole?: string;
  pubsub?: any;
}

export async function createContext(initialContext: YogaInitialContext): Promise<GraphQLContext> {
  const context: GraphQLContext = {
    ...initialContext,
  };

  // Extract token from headers
  const authHeader = initialContext.request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      context.userId = decoded.userId;
      context.userRole = decoded.role;
    } catch (error) {
      logger.warn('Invalid GraphQL authentication token');
    }
  }

  return context;
}
