/**
 * Review Service
 * Handles restaurant reviews and ratings
 */

import prisma from '@/config/database';
import { BadRequestError, NotFoundError } from '@/utils/errors/AppError';
import logger from '@/utils/logger';

export class ReviewService {
  /**
   * Create review
   */
  static async createReview(data: {
    customerId: string;
    restaurantId: string;
    orderId?: string;
    rating: number;
    comment?: string;
  }) {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestError('Rating must be between 1 and 5');
    }

    // If orderId provided, verify it's a completed order
    if (data.orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: data.orderId,
          customerId: data.customerId,
          restaurantId: data.restaurantId,
          status: 'DELIVERED',
        },
      });

      if (!order) {
        throw new BadRequestError('Invalid order for review');
      }

      // Check if review already exists for this order
      const existingReview = await prisma.review.findFirst({
        where: { orderId: data.orderId },
      });

      if (existingReview) {
        throw new BadRequestError('Review already exists for this order');
      }
    }

    // Create review
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          customerId: data.customerId,
          restaurantId: data.restaurantId,
          orderId: data.orderId,
          rating: data.rating,
          comment: data.comment,
          isVerified: !!data.orderId, // Verified if linked to order
        },
      });

      // Update restaurant rating
      const avgRating = await tx.review.aggregate({
        where: { restaurantId: data.restaurantId },
        _avg: { rating: true },
        _count: true,
      });

      await tx.restaurant.update({
        where: { id: data.restaurantId },
        data: {
          rating: avgRating._avg.rating || 0,
          totalReviews: avgRating._count,
        },
      });

      return newReview;
    });

    logger.info(`Review created: ${review.id} for restaurant ${data.restaurantId}`);
    return review;
  }

  /**
   * Get restaurant reviews
   */
  static async getRestaurantReviews(
    restaurantId: string,
    filters?: {
      rating?: number;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { restaurantId };
    if (filters?.rating) {
      where.rating = filters.rating;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      items: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update review
   */
  static async updateReview(
    reviewId: string,
    customerId: string,
    data: {
      rating?: number;
      comment?: string;
    }
  ) {
    // Verify review belongs to customer
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        customerId,
      },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Validate rating if provided
    if (data.rating && (data.rating < 1 || data.rating > 5)) {
      throw new BadRequestError('Rating must be between 1 and 5');
    }

    // Update review
    const updated = await prisma.$transaction(async (tx) => {
      const updatedReview = await tx.review.update({
        where: { id: reviewId },
        data,
      });

      // Recalculate restaurant rating
      const avgRating = await tx.review.aggregate({
        where: { restaurantId: review.restaurantId },
        _avg: { rating: true },
        _count: true,
      });

      await tx.restaurant.update({
        where: { id: review.restaurantId },
        data: {
          rating: avgRating._avg.rating || 0,
          totalReviews: avgRating._count,
        },
      });

      return updatedReview;
    });

    logger.info(`Review updated: ${reviewId}`);
    return updated;
  }

  /**
   * Delete review
   */
  static async deleteReview(reviewId: string, customerId: string) {
    // Verify review belongs to customer
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        customerId,
      },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Delete review
    await prisma.$transaction(async (tx) => {
      await tx.review.delete({
        where: { id: reviewId },
      });

      // Recalculate restaurant rating
      const avgRating = await tx.review.aggregate({
        where: { restaurantId: review.restaurantId },
        _avg: { rating: true },
        _count: true,
      });

      await tx.restaurant.update({
        where: { id: review.restaurantId },
        data: {
          rating: avgRating._avg.rating || 0,
          totalReviews: avgRating._count,
        },
      });
    });

    logger.info(`Review deleted: ${reviewId}`);
  }

  /**
   * Add restaurant response to review
   */
  static async addRestaurantResponse(
    reviewId: string,
    restaurantId: string,
    response: string
  ) {
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        restaurantId,
      },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { response },
    });

    logger.info(`Restaurant response added to review: ${reviewId}`);
    return updated;
  }
}
