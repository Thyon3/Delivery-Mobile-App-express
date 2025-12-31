/**
 * Promotion Service
 * Handles promotional campaigns and discounts
 */

import prisma from '@/config/database';
import { NotFoundError, BadRequestError } from '@/utils/errors/AppError';
import logger from '@/utils/logger';

export class PromotionService {
  /**
   * Create promotion
   */
  static async createPromotion(data: {
    code: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    startDate: Date;
    endDate: Date;
    usageLimit?: number;
    perUserLimit?: number;
    applicableRestaurants?: string[];
    isActive?: boolean;
  }) {
    // Check if code already exists
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM promotions WHERE code = ${data.code}
    `;

    if (existing.length > 0) {
      throw new BadRequestError('Promotion code already exists');
    }

    const promotion = await prisma.$queryRaw<any[]>`
      INSERT INTO promotions (
        id, code, type, value, "minOrderAmount", "maxDiscountAmount",
        "startDate", "endDate", "usageLimit", "perUserLimit",
        "applicableRestaurants", "isActive", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        ${data.code},
        ${data.type},
        ${data.value},
        ${data.minOrderAmount || 0},
        ${data.maxDiscountAmount || null},
        ${data.startDate},
        ${data.endDate},
        ${data.usageLimit || null},
        ${data.perUserLimit || 1},
        ${data.applicableRestaurants ? JSON.stringify(data.applicableRestaurants) : null},
        ${data.isActive !== false},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    logger.info(`Promotion created: ${data.code}`);
    return promotion[0];
  }

  /**
   * Validate and apply promotion
   */
  static async validatePromotion(code: string, userId: string, restaurantId: string, orderAmount: number) {
    const promotion = await prisma.$queryRaw<any[]>`
      SELECT * FROM promotions
      WHERE code = ${code}
        AND "isActive" = true
        AND "startDate" <= NOW()
        AND "endDate" >= NOW()
    `;

    if (promotion.length === 0) {
      throw new NotFoundError('Invalid or expired promotion code');
    }

    const promo = promotion[0];

    // Check minimum order amount
    if (promo.minOrderAmount && orderAmount < promo.minOrderAmount) {
      throw new BadRequestError(`Minimum order amount is $${promo.minOrderAmount}`);
    }

    // Check restaurant applicability
    if (promo.applicableRestaurants && promo.applicableRestaurants.length > 0) {
      if (!promo.applicableRestaurants.includes(restaurantId)) {
        throw new BadRequestError('Promotion not applicable to this restaurant');
      }
    }

    // Check usage limits
    const usageCount = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM promotion_usage
      WHERE "promotionId" = ${promo.id}
    `;

    if (promo.usageLimit && usageCount[0].count >= promo.usageLimit) {
      throw new BadRequestError('Promotion usage limit reached');
    }

    // Check per-user limit
    const userUsageCount = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM promotion_usage
      WHERE "promotionId" = ${promo.id} AND "userId" = ${userId}
    `;

    if (promo.perUserLimit && userUsageCount[0].count >= promo.perUserLimit) {
      throw new BadRequestError('You have already used this promotion');
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.type === 'PERCENTAGE') {
      discountAmount = (orderAmount * promo.value) / 100;
      if (promo.maxDiscountAmount && discountAmount > promo.maxDiscountAmount) {
        discountAmount = promo.maxDiscountAmount;
      }
    } else {
      discountAmount = promo.value;
    }

    return {
      promotion: promo,
      discountAmount: Math.round(discountAmount * 100) / 100,
    };
  }

  /**
   * Record promotion usage
   */
  static async recordPromotionUsage(promotionId: string, userId: string, orderId: string) {
    await prisma.$queryRaw`
      INSERT INTO promotion_usage ("promotionId", "userId", "orderId", "usedAt")
      VALUES (${promotionId}, ${userId}, ${orderId}, NOW())
    `;

    logger.info(`Promotion used: ${promotionId} by user ${userId}`);
  }

  /**
   * Get active promotions
   */
  static async getActivePromotions(restaurantId?: string) {
    let query = `
      SELECT * FROM promotions
      WHERE "isActive" = true
        AND "startDate" <= NOW()
        AND "endDate" >= NOW()
    `;

    if (restaurantId) {
      query += ` AND ("applicableRestaurants" IS NULL OR "applicableRestaurants" @> '["${restaurantId}"]'::jsonb)`;
    }

    query += ` ORDER BY "createdAt" DESC`;

    const promotions = await prisma.$queryRawUnsafe<any[]>(query);
    return promotions;
  }
}
