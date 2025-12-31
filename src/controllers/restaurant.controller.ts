/**
 * Restaurant Controller
 */

import { Request, Response } from 'express';
import { RestaurantService } from '@/services/restaurant.service';
import { GeolocationService } from '@/services/geolocation.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { ResponseHelper } from '@/utils/response';

export class RestaurantController {
  /**
   * @swagger
   * /restaurants/nearby:
   *   get:
   *     tags: [Restaurants]
   *     summary: Find restaurants nearby
   */
  static getNearbyRestaurants = asyncHandler(async (req: Request, res: Response) => {
    const { latitude, longitude, radius, cuisineTypes, isOpen, minimumRating } = req.query;

    const restaurants = await GeolocationService.findRestaurantsNearby(
      parseFloat(latitude as string),
      parseFloat(longitude as string),
      radius ? parseFloat(radius as string) : undefined,
      {
        cuisineTypes: cuisineTypes ? (cuisineTypes as string).split(',') : undefined,
        isOpen: isOpen === 'true',
        minimumRating: minimumRating ? parseFloat(minimumRating as string) : undefined,
      }
    );

    return ResponseHelper.success(res, restaurants, 'Restaurants fetched successfully');
  });

  /**
   * @swagger
   * /restaurants/{id}:
   *   get:
   *     tags: [Restaurants]
   *     summary: Get restaurant by ID
   */
  static getRestaurantById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const includeMenu = req.query.includeMenu !== 'false';

    const restaurant = await RestaurantService.getRestaurantById(id, includeMenu);
    return ResponseHelper.success(res, restaurant, 'Restaurant fetched successfully');
  });

  /**
   * @swagger
   * /restaurants:
   *   post:
   *     tags: [Restaurants]
   *     summary: Create a new restaurant
   */
  static createRestaurant = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const restaurant = await RestaurantService.createRestaurant({
      ...req.body,
      ownerId: userId,
    });

    return ResponseHelper.created(res, restaurant, 'Restaurant created successfully');
  });

  /**
   * @swagger
   * /restaurants/{id}:
   *   put:
   *     tags: [Restaurants]
   *     summary: Update restaurant
   */
  static updateRestaurant = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const restaurant = await RestaurantService.updateRestaurant(id, req.body);
    return ResponseHelper.success(res, restaurant, 'Restaurant updated successfully');
  });

  /**
   * @swagger
   * /restaurants/{id}/categories:
   *   post:
   *     tags: [Menu]
   *     summary: Create menu category
   */
  static createCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id: restaurantId } = req.params;

    const category = await RestaurantService.createCategory({
      restaurantId,
      ...req.body,
    });

    return ResponseHelper.created(res, category, 'Category created successfully');
  });

  /**
   * @swagger
   * /restaurants/{id}/menu-items:
   *   post:
   *     tags: [Menu]
   *     summary: Create menu item
   */
  static createMenuItem = asyncHandler(async (req: Request, res: Response) => {
    const { id: restaurantId } = req.params;

    const menuItem = await RestaurantService.createMenuItem({
      restaurantId,
      ...req.body,
    });

    return ResponseHelper.created(res, menuItem, 'Menu item created successfully');
  });

  /**
   * @swagger
   * /menu-items/{id}:
   *   put:
   *     tags: [Menu]
   *     summary: Update menu item
   */
  static updateMenuItem = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const menuItem = await RestaurantService.updateMenuItem(id, req.body);
    return ResponseHelper.success(res, menuItem, 'Menu item updated successfully');
  });

  /**
   * @swagger
   * /menu-items/{id}:
   *   delete:
   *     tags: [Menu]
   *     summary: Delete menu item
   */
  static deleteMenuItem = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await RestaurantService.deleteMenuItem(id);
    return ResponseHelper.success(res, null, 'Menu item deleted successfully');
  });

  /**
   * @swagger
   * /restaurants/{id}/orders:
   *   get:
   *     tags: [Restaurants]
   *     summary: Get restaurant orders
   */
  static getRestaurantOrders = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, page, limit } = req.query;

    const orders = await RestaurantService.getRestaurantOrders(id, {
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    return ResponseHelper.success(res, orders, 'Orders fetched successfully');
  });

  /**
   * @swagger
   * /restaurants/{id}/stats:
   *   get:
   *     tags: [Restaurants]
   *     summary: Get restaurant statistics
   */
  static getRestaurantStats = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const stats = await RestaurantService.getRestaurantStats(id);
    return ResponseHelper.success(res, stats, 'Statistics fetched successfully');
  });
}
