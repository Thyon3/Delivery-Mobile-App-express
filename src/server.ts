/**
 * Main Server Entry Point
 */

import express, { Application } from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import 'express-async-errors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import configurations and middleware
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { connectRedis, disconnectRedis } from '@/config/redis';
import { swaggerSpec } from '@/config/swagger';
import { errorHandler, notFoundHandler } from '@/middlewares/errorHandler';
import { apiLimiter } from '@/middlewares/rateLimiter';
import logger from '@/utils/logger';

// Import routes
import routes from '@/routes';

// Import Socket.io service
import { SocketService } from '@/services/socket.service';

// Import GraphQL server
import { createGraphQLServer } from '@/graphql/server';

class Server {
  private app: Application;
  private httpServer: ReturnType<typeof createServer>;
  private socketService: SocketService;
  private port: number;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.socketService = new SocketService(this.httpServer);
    this.port = parseInt(process.env.PORT || '5000');

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable for Swagger UI
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    }));

    // Compression
    this.app.use(compression());

    // Body parsers
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Cookie parser
    this.app.use(cookieParser());

    // Request logging
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim()),
        },
      }));
    }

    // Rate limiting (apply to API routes only)
    this.app.use('/api', apiLimiter);

    logger.info('✅ Middleware initialized');
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // API version prefix
    const apiVersion = process.env.API_VERSION || 'v1';

    // Swagger documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
    }));

    // API routes
    this.app.use(`/api/${apiVersion}`, routes);

    // GraphQL endpoint
    const graphqlServer = createGraphQLServer();
    this.app.use('/graphql', graphqlServer);

    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Delivery App API',
        version: apiVersion,
        documentation: '/api-docs',
        health: `/api/${apiVersion}/health`,
      });
    });

    logger.info('✅ Routes initialized');
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);

    logger.info('✅ Error handling initialized');
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();

      // Connect to Redis
      await connectRedis();

      // Start HTTP server
      this.httpServer.listen(this.port, () => {
        logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Delivery App API Server                             ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                                    ║
║   Port: ${this.port}                                              ║
║   API Base: http://localhost:${this.port}/api/${process.env.API_VERSION || 'v1'}              ║
║   Docs: http://localhost:${this.port}/api-docs                   ║
║                                                           ║
║   Database: ✅ Connected                                  ║
║   Redis: ✅ Connected                                     ║
║   Socket.io: ✅ Running                                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
      });

      // Handle graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      this.httpServer.close(async () => {
        logger.info('HTTP server closed');

        // Disconnect from database
        await disconnectDatabase();

        // Disconnect from Redis
        await disconnectRedis();

        logger.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle termination signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }
}

// Create and start server
const server = new Server();
server.start();

export default server;
