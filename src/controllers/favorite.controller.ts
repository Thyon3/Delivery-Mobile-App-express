/**
 * Favorite Controller
 */

import { Request, Response } from 'express';
import { FavoriteService } from '@/services/favorite.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { ResponseHelper } from '@/utils/response';

export class FavoriteController {
  /**
   * Add to favorites
   */
  static addFavorite = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { restaurantId } = req.body;

    const result = await FavoriteService.addFavorite(userId, restaurantId);
    return ResponseHelper.success(res, result, 'Added to favorites');
  });

  /**
   * Remove from favorites
   */
  static removeFavorite = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { restaurantId } = req.params;

    const result = await FavoriteService.removeFavorite(userId, restaurantId);
    return ResponseHelper.success(res, result, 'Removed from favorites');
  });

  /**
   * Get favorites
   */
  static getFavorites = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const favorites = await FavoriteService.getFavorites(userId);
    return ResponseHelper.success(res, favorites, 'Favorites fetched successfully');
  });

  /**
   * Check if favorited
   */
  static checkFavorite = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { restaurantId } = req.params;

    const isFavorite = await FavoriteService.isFavorite(userId, restaurantId);
    return ResponseHelper.success(res, { isFavorite }, 'Favorite status fetched');
  });

  /**
   * Add menu item to favorites
   */
  static addFavoriteMenuItem = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { menuItemId } = req.body;

    const result = await FavoriteService.addFavoriteMenuItem(userId, menuItemId);
    return ResponseHelper.success(res, result, 'Menu item added to favorites');
  });

  /**
   * Remove menu item from favorites
   */
  static removeFavoriteMenuItem = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { menuItemId } = req.params;

    const result = await FavoriteService.removeFavoriteMenuItem(userId, menuItemId);
    return ResponseHelper.success(res, result, 'Menu item removed from favorites');
  });

  /**
   * Get favorite menu items
   */
  static getFavoriteMenuItems = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const favorites = await FavoriteService.getFavoriteMenuItems(userId);
    return ResponseHelper.success(res, favorites, 'Favorite menu items fetched successfully');
  });
}
