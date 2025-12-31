/**
 * Application Configuration
 */

export const appConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000'),
  apiVersion: process.env.API_VERSION || 'v1',
  
  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  database: {
    url: process.env.DATABASE_URL!,
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  },
  
  geolocation: {
    defaultSearchRadiusKm: parseFloat(process.env.DEFAULT_SEARCH_RADIUS_KM || '10'),
    maxSearchRadiusKm: parseFloat(process.env.MAX_SEARCH_RADIUS_KM || '50'),
    baseDeliveryFee: parseFloat(process.env.BASE_DELIVERY_FEE || '2.99'),
    costPerKm: parseFloat(process.env.COST_PER_KM || '0.50'),
  },
  
  upload: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '5'),
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
};

export const isDevelopment = appConfig.env === 'development';
export const isProduction = appConfig.env === 'production';
export const isTest = appConfig.env === 'test';
