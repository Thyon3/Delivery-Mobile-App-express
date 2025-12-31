/**
 * Response Caching Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { CacheService } from '@/config/redis';
import logger from '@/utils/logger';

export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl}`;

    try {
      // Check cache
      const cachedData = await CacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`Cache hit: ${cacheKey}`);
        return res.json(cachedData);
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function(data: any) {
        // Cache the response
        CacheService.set(cacheKey, data, ttl).catch(err => {
          logger.error('Cache set error:', err);
        });

        // Call original json method
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};
