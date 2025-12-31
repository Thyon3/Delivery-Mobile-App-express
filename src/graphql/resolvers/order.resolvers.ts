/**
 * Order GraphQL Resolvers
 */

import { OrderService } from '@/services/order.service';
import { GraphQLError } from 'graphql';

export const orderResolvers = {
  Query: {
    order: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return await OrderService.getOrderById(id);
    },
    
    myOrders: async (_: any, args: any, context: any) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const result = await OrderService.getUserOrders(context.userId, {
        status: args.status,
        limit: args.limit || 20,
      });
      
      return result.items;
    },
  },
  
  Mutation: {
    createOrder: async (_: any, { input }: any, context: any) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return await OrderService.createOrder({
        customerId: context.userId,
        ...input,
      });
    },
    
    updateOrderStatus: async (_: any, { orderId, status }: any, context: any) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return await OrderService.updateOrderStatus(orderId, status, context.userId);
    },
    
    cancelOrder: async (_: any, { orderId, reason }: any, context: any) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return await OrderService.cancelOrder(orderId, context.userId, reason);
    },
  },
  
  Subscription: {
    orderStatusChanged: {
      subscribe: (_: any, { orderId }: any, context: any) => {
        if (!context.userId) {
          throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        // Subscribe to order status changes via pubsub
        return context.pubsub.asyncIterator(`ORDER_STATUS_${orderId}`);
      },
    },
    
    driverLocationUpdated: {
      subscribe: (_: any, { orderId }: any, context: any) => {
        if (!context.userId) {
          throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
        }
        
        // Subscribe to driver location updates
        return context.pubsub.asyncIterator(`DRIVER_LOCATION_${orderId}`);
      },
    },
  },
  
  Order: {
    customer: async (parent: any) => {
      return parent.customer;
    },
    
    restaurant: async (parent: any) => {
      return parent.restaurant;
    },
    
    items: async (parent: any) => {
      return parent.items || [];
    },
    
    delivery: async (parent: any) => {
      return parent.delivery;
    },
  },
};
