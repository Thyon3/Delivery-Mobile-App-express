/**
 * Review Controller
 */

import { Request, Response } from 'express';
import { ReviewService } from '@/services/review.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { ResponseHelper } from '@/utils/response';

export class ReviewController {
  /**
   * Create review
   */
  static createReview = asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.userId!;
    const review = await ReviewService.createReview({
      customerId,
      ...req.body,
    });
    return ResponseHelper.created(res, review, 'Review created successfully');
  });

  /**
   * Get restaurant reviews
   */
  static getRestaurantReviews = asyncHandler(async (req: Request, res: Response) => {
    const { restaurantId } = req.params;
    const { rating, page, limit } = req.query;
    const reviews = await ReviewService.getRestaurantReviews(restaurantId, {
      rating: rating ? parseInt(rating as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    return ResponseHelper.success(res, reviews, 'Reviews fetched successfully');
  });

  /**
   * Update review
   */
  static updateReview = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const customerId = req.userId!;
    const review = await ReviewService.updateReview(id, customerId, req.body);
    return ResponseHelper.success(res, review, 'Review updated successfully');
  });

  /**
   * Delete review
   */
  static deleteReview = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const customerId = req.userId!;
    await ReviewService.deleteReview(id, customerId);
    return ResponseHelper.success(res, null, 'Review deleted successfully');
  });

  /**
   * Add restaurant response
   */
  static addResponse = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { restaurantId, response } = req.body;
    const review = await ReviewService.addRestaurantResponse(id, restaurantId, response);
    return ResponseHelper.success(res, review, 'Response added successfully');
  });
}
