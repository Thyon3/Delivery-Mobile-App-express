/**
 * Analytics Tracking Middleware
 */

import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger';

/**
 * Track API endpoint usage
 */
export const trackApiUsage = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log API usage
    logger.info('API Usage', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userId: req.userId,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });

    // In production, send to analytics service (Mixpanel, Segment, etc.)
  });

  next();
};

/**
 * Track errors
 */
export const trackErrors = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error with context
  logger.error('Error tracked', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.userId,
    ip: req.ip,
  });

  // In production, send to error tracking service (Sentry, Bugsnag, etc.)

  next(err);
};
