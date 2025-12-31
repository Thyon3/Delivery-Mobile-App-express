/**
 * Environment Variables Type Definitions
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Application
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      API_VERSION: string;

      // Database
      DATABASE_URL: string;

      // JWT
      JWT_SECRET: string;
      JWT_REFRESH_SECRET: string;
      JWT_EXPIRES_IN: string;
      JWT_REFRESH_EXPIRES_IN: string;

      // Redis
      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_PASSWORD?: string;

      // Stripe
      STRIPE_SECRET_KEY: string;
      STRIPE_WEBHOOK_SECRET: string;

      // Socket.io
      SOCKET_IO_CORS_ORIGIN: string;

      // Rate Limiting
      RATE_LIMIT_WINDOW_MS: string;
      RATE_LIMIT_MAX_REQUESTS: string;

      // Email
      SMTP_HOST: string;
      SMTP_PORT: string;
      SMTP_USER: string;
      SMTP_PASSWORD: string;

      // SMS
      TWILIO_ACCOUNT_SID: string;
      TWILIO_AUTH_TOKEN: string;
      TWILIO_PHONE_NUMBER: string;

      // Geolocation
      DEFAULT_SEARCH_RADIUS_KM: string;
      MAX_SEARCH_RADIUS_KM: string;
      BASE_DELIVERY_FEE: string;
      COST_PER_KM: string;

      // File Upload
      MAX_FILE_SIZE_MB: string;
      UPLOAD_PATH: string;

      // Logging
      LOG_LEVEL: string;
      LOG_FILE_PATH: string;

      // CORS
      CORS_ORIGIN: string;

      // Encryption
      ENCRYPTION_KEY?: string;

      // Base URL
      BASE_URL?: string;
    }
  }
}

export {};
