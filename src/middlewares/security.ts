/**
 * Additional Security Middleware
 */

import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger';

/**
 * Detect and block SQL injection attempts
 */
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(union\s+select)/gi,
    /(\bOR\b\s+\d+\s*=\s*\d+)/gi,
    /(--|#|\/\*|\*\/)/g,
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return sqlPatterns.some((pattern) => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some((v) => checkValue(v));
    }
    return false;
  };

  // Check body, query, params
  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    logger.warn(`Potential SQL injection attempt detected from ${req.ip}`);
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected',
      statusCode: 400,
    });
  }

  next();
};

/**
 * Remove empty strings and null values
 */
export const sanitizeEmptyValues = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map((item) => sanitize(item));
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        const value = obj[key];
        if (value !== '' && value !== null && value !== undefined) {
          sanitized[key] = sanitize(value);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }

  next();
};

/**
 * Request ID middleware
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};
