/**
 * Review GraphQL Resolvers
 */

import { ReviewService } from '@/services/review.service';
import { GraphQLError } from 'graphql';

export const reviewResolvers = {
  Query: {
    reviews: async (_: any, args: any) => {
      const { restaurantId, limit } = args;
      const result = await ReviewService.getRestaurantReviews(restaurantId, {
        limit: limit || 20,
      });
      return result.items;
    },
  },
  
  Mutation: {
    createReview: async (_: any, { input }: any, context: any) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return await ReviewService.createReview({
        customerId: context.userId,
        ...input,
      });
    },
    
    updateReview: async (_: any, { reviewId, input }: any, context: any) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return await ReviewService.updateReview(reviewId, context.userId, input);
    },
  },
  
  Review: {
    customer: async (parent: any) => {
      return parent.customer;
    },
    
    restaurant: async (parent: any) => {
      return parent.restaurant;
    },
  },
};
