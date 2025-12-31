/**
 * Restaurant GraphQL Resolvers
 */

import { RestaurantService } from '@/services/restaurant.service';
import { GeolocationService } from '@/services/geolocation.service';
import { GraphQLError } from 'graphql';

export const restaurantResolvers = {
  Query: {
    restaurant: async (_: any, { id }: { id: string }) => {
      return await RestaurantService.getRestaurantById(id, true);
    },
    
    restaurants: async (_: any, args: any) => {
      const { latitude, longitude, radius, cuisineTypes, limit } = args;
      
      if (latitude && longitude) {
        return await GeolocationService.findRestaurantsNearby(
          latitude,
          longitude,
          radius,
          { cuisineTypes, isOpen: true }
        );
      }
      
      // Return all active restaurants if no location provided
      return await RestaurantService.getRestaurantById('', false);
    },
    
    menuItems: async (_: any, { restaurantId }: { restaurantId: string }) => {
      const restaurant = await RestaurantService.getRestaurantById(restaurantId, true);
      return restaurant.categories.flatMap((cat: any) => cat.menuItems);
    },
  },
  
  Mutation: {
    createRestaurant: async (_: any, { input }: any, context: any) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return await RestaurantService.createRestaurant({
        ...input,
        ownerId: context.userId,
      });
    },
    
    updateRestaurant: async (_: any, { restaurantId, input }: any, context: any) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return await RestaurantService.updateRestaurant(restaurantId, input);
    },
    
    createMenuItem: async (_: any, { input }: any, context: any) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return await RestaurantService.createMenuItem(input);
    },
    
    updateMenuItem: async (_: any, { menuItemId, input }: any, context: any) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return await RestaurantService.updateMenuItem(menuItemId, input);
    },
  },
  
  Restaurant: {
    categories: async (parent: any) => {
      return parent.categories || [];
    },
    
    reviews: async (parent: any) => {
      return parent.reviews || [];
    },
  },
};
