/**
 * User GraphQL Resolvers
 */

import { AuthService } from '@/services/auth.service';
import { UserService } from '@/services/user.service';
import { GraphQLError } from 'graphql';

export const userResolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return await UserService.getUserProfile(context.userId);
    },
    
    user: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return await UserService.getUserProfile(id);
    },
  },
  
  Mutation: {
    register: async (_: any, { input }: any) => {
      const result = await AuthService.register(input);
      return {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    },
    
    login: async (_: any, { email, password }: any) => {
      const result = await AuthService.login(email, password);
      return {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    },
  },
  
  User: {
    // Field resolvers can be added here if needed
  },
};
