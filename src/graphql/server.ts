/**
 * GraphQL Server Setup
 */

import { createYoga } from 'graphql-yoga';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { createContext } from './context';
import logger from '@/utils/logger';

export const createGraphQLServer = () => {
  const yoga = createYoga({
    schema: {
      typeDefs,
      resolvers,
    },
    context: createContext,
    graphiql: process.env.NODE_ENV !== 'production',
    logging: {
      debug: (...args) => logger.debug('GraphQL Debug:', ...args),
      info: (...args) => logger.info('GraphQL Info:', ...args),
      warn: (...args) => logger.warn('GraphQL Warning:', ...args),
      error: (...args) => logger.error('GraphQL Error:', ...args),
    },
    maskedErrors: process.env.NODE_ENV === 'production',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
  });

  logger.info('✅ GraphQL server configured');

  return yoga;
};
