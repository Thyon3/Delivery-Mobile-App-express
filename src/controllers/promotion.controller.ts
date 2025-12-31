/**
 * Promotion Controller
 */

import { Request, Response } from 'express';
import { PromotionService } from '@/services/promotion.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { ResponseHelper } from '@/utils/response';

export class PromotionController {
  /**
   * Create promotion (Admin only)
   */
  static createPromotion = asyncHandler(async (req: Request, res: Response) => {
    const promotion = await PromotionService.createPromotion(req.body);
    return ResponseHelper.created(res, promotion, 'Promotion created successfully');
  });

  /**
   * Validate promotion code
   */
  static validatePromotion = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { code, restaurantId, orderAmount } = req.body;

    const result = await PromotionService.validatePromotion(
      code,
      userId,
      restaurantId,
      orderAmount
    );

    return ResponseHelper.success(res, result, 'Promotion is valid');
  });

  /**
   * Get active promotions
   */
  static getActivePromotions = asyncHandler(async (req: Request, res: Response) => {
    const { restaurantId } = req.query;

    const promotions = await PromotionService.getActivePromotions(restaurantId as string);
    return ResponseHelper.success(res, promotions, 'Active promotions fetched successfully');
  });
}
