/**
 * GraphQL Resolvers
 */

import { userResolvers } from './user.resolvers';
import { restaurantResolvers } from './restaurant.resolvers';
import { orderResolvers } from './order.resolvers';
import { reviewResolvers } from './review.resolvers';
import { GraphQLDateTime, JSONResolver } from 'graphql-scalars';

export const resolvers = {
  DateTime: GraphQLDateTime,
  JSON: JSONResolver,
  
  Query: {
    ...userResolvers.Query,
    ...restaurantResolvers.Query,
    ...orderResolvers.Query,
    ...reviewResolvers.Query,
  },
  
  Mutation: {
    ...userResolvers.Mutation,
    ...restaurantResolvers.Mutation,
    ...orderResolvers.Mutation,
    ...reviewResolvers.Mutation,
  },
  
  Subscription: {
    ...orderResolvers.Subscription,
  },
  
  // Field resolvers
  User: userResolvers.User,
  Restaurant: restaurantResolvers.Restaurant,
  Order: orderResolvers.Order,
  Review: reviewResolvers.Review,
};
