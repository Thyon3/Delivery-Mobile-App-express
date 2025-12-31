/**
 * Search Controller
 */

import { Request, Response } from 'express';
import { SearchService } from '@/services/search.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { ResponseHelper } from '@/utils/response';

export class SearchController {
  static searchRestaurants = asyncHandler(async (req: Request, res: Response) => {
    const { q, latitude, longitude, radius, cuisineTypes, minRating } = req.query;
    
    if (!q) {
      return ResponseHelper.error(res, 'Search query is required', 400);
    }
    
    const results = await SearchService.searchRestaurants(q as string, {
      latitude: latitude ? parseFloat(latitude as string) : undefined,
      longitude: longitude ? parseFloat(longitude as string) : undefined,
      radius: radius ? parseFloat(radius as string) : undefined,
      cuisineTypes: cuisineTypes ? (cuisineTypes as string).split(',') : undefined,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
    });
    
    return ResponseHelper.success(res, results, 'Search completed successfully');
  });

  static searchMenuItems = asyncHandler(async (req: Request, res: Response) => {
    const { q, restaurantId } = req.query;
    
    if (!q) {
      return ResponseHelper.error(res, 'Search query is required', 400);
    }
    
    const results = await SearchService.searchMenuItems(
      q as string,
      restaurantId as string
    );
    
    return ResponseHelper.success(res, results, 'Search completed successfully');
  });

  static getPopularSearches = asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query;
    
    const searches = await SearchService.getPopularSearches(
      limit ? parseInt(limit as string) : undefined
    );
    
    return ResponseHelper.success(res, searches, 'Popular searches fetched successfully');
  });
}
