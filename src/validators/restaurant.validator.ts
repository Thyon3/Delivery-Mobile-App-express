/**
 * Restaurant Validators using Zod
 */

import { z } from 'zod';

export const createRestaurantSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Restaurant name is required'),
    description: z.string().optional(),
    phone: z.string().min(1, 'Phone number is required'),
    email: z.string().email('Invalid email format').optional(),
    latitude: z.number().min(-90).max(90, 'Invalid latitude'),
    longitude: z.number().min(-180).max(180, 'Invalid longitude'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
    cuisineTypes: z.array(z.string()).min(1, 'At least one cuisine type is required'),
    openingTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
    closingTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
    deliveryFee: z.number().min(0).optional(),
    minimumOrder: z.number().min(0).optional(),
  }),
});

export const createMenuItemSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid('Invalid category ID'),
    name: z.string().min(1, 'Menu item name is required'),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be positive'),
    discountPrice: z.number().min(0).optional(),
    isVegetarian: z.boolean().optional(),
    isVegan: z.boolean().optional(),
    preparationTime: z.number().min(1).optional(),
    addons: z.array(
      z.object({
        name: z.string().min(1, 'Addon name is required'),
        price: z.number().min(0, 'Price must be positive'),
      })
    ).optional(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required'),
    description: z.string().optional(),
    displayOrder: z.number().min(0).optional(),
  }),
});
