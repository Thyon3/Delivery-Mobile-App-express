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
}
