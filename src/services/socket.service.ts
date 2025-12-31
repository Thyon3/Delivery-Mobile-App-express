/**
 * Socket.io Service for Real-time Tracking
 * Handles real-time communication between customers, drivers, and restaurants
 */

import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import logger from '@/utils/logger';
import prisma from '@/config/database';
import { GeolocationService } from './geolocation.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export class SocketService {
  private io: SocketServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private driverSockets: Map<string, string> = new Map(); // driverId -> socketId
  private orderRooms: Map<string, Set<string>> = new Map(); // orderId -> Set of socketIds

  constructor(httpServer: HttpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.SOCKET_IO_CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    logger.info('✅ Socket.io server initialized');
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string;
          role: string;
        };

        // Attach user info to socket
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;

        logger.debug(`Socket authenticated: ${decoded.userId} (${decoded.role})`);
        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(new Error('Invalid token'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`Client connected: ${socket.id} - User: ${socket.userId}`);

      // Store user connection
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);
      }

      // Handle different user roles
      if (socket.userRole === 'DRIVER') {
        this.handleDriverConnection(socket);
      } else if (socket.userRole === 'CUSTOMER') {
        this.handleCustomerConnection(socket);
      } else if (socket.userRole === 'RESTAURANT_OWNER') {
        this.handleRestaurantConnection(socket);
      }

      // Common event handlers
      this.setupCommonHandlers(socket);

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });
    });
  }

  /**
   * Handle driver-specific events
   */
  private handleDriverConnection(socket: AuthenticatedSocket) {
    // Join driver room
    socket.join(`driver:${socket.userId}`);

    // Get driver ID from user ID
    prisma.driver.findUnique({
      where: { userId: socket.userId },
      select: { id: true },
    }).then((driver) => {
      if (driver) {
        this.driverSockets.set(driver.id, socket.id);
        
        // Update driver status to ONLINE
        prisma.driver.update({
          where: { id: driver.id },
          data: { status: 'ONLINE' },
        });
      }
    });

    // Handle location updates
    socket.on('driver:location:update', async (data: { latitude: number; longitude: number }) => {
      await this.handleDriverLocationUpdate(socket, data);
    });

    // Handle order acceptance
    socket.on('driver:order:accept', async (data: { orderId: string }) => {
      await this.handleDriverAcceptOrder(socket, data);
    });

    // Handle order status updates
    socket.on('driver:order:status', async (data: { orderId: string; status: string }) => {
      await this.handleDriverOrderStatus(socket, data);
    });

    logger.info(`Driver connected: ${socket.userId}`);
  }

  /**
   * Handle customer-specific events
   */
  private handleCustomerConnection(socket: AuthenticatedSocket) {
    // Join customer room
    socket.join(`customer:${socket.userId}`);

    // Handle order tracking subscription
    socket.on('customer:track:order', async (data: { orderId: string }) => {
      await this.handleCustomerTrackOrder(socket, data);
    });

    logger.info(`Customer connected: ${socket.userId}`);
  }

  /**
   * Handle restaurant-specific events
   */
  private handleRestaurantConnection(socket: AuthenticatedSocket) {
    // Join restaurant owner room
    socket.join(`restaurant_owner:${socket.userId}`);

    // Get restaurants owned by this user
    prisma.restaurant.findMany({
      where: { 
        owner: { userId: socket.userId }
      },
      select: { id: true },
    }).then((restaurants) => {
      restaurants.forEach(restaurant => {
        socket.join(`restaurant:${restaurant.id}`);
      });
    });

    logger.info(`Restaurant owner connected: ${socket.userId}`);
  }

  /**
   * Setup common event handlers
   */
  private setupCommonHandlers(socket: AuthenticatedSocket) {
    // Ping/Pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.userId}:`, error);
    });
  }

  /**
   * Handle driver location updates
   */
  private async handleDriverLocationUpdate(
    socket: AuthenticatedSocket,
    data: { latitude: number; longitude: number }
  ) {
    try {
      const { latitude, longitude } = data;

      // Validate coordinates
      if (!GeolocationService.validateCoordinates(latitude, longitude)) {
        socket.emit('error', { message: 'Invalid coordinates' });
        return;
      }

      // Get driver
      const driver = await prisma.driver.findUnique({
        where: { userId: socket.userId },
        include: {
          deliveries: {
            where: {
              deliveredAt: null,
            },
            include: {
              order: true,
            },
          },
        },
      });

      if (!driver) {
        socket.emit('error', { message: 'Driver not found' });
        return;
      }

      // Update driver location
      await GeolocationService.updateDriverLocation(driver.id, latitude, longitude);

      // If driver has active delivery, broadcast location to customer and restaurant
      if (driver.deliveries.length > 0) {
        for (const delivery of driver.deliveries) {
          // Save tracking point
          await prisma.deliveryTracking.create({
            data: {
              deliveryId: delivery.id,
              latitude,
              longitude,
            },
          });

          // Broadcast to customer
          this.io.to(`customer:${delivery.order.customerId}`).emit('driver:location', {
            orderId: delivery.orderId,
            latitude,
            longitude,
            timestamp: new Date(),
          });

          // Broadcast to restaurant
          this.io.to(`restaurant:${delivery.order.restaurantId}`).emit('driver:location', {
            orderId: delivery.orderId,
            latitude,
            longitude,
            timestamp: new Date(),
          });

          // Broadcast to order room
          this.io.to(`order:${delivery.orderId}`).emit('driver:location', {
            latitude,
            longitude,
            timestamp: new Date(),
          });
        }
      }

      logger.debug(`Driver location updated: ${driver.id}`);
    } catch (error) {
      logger.error('Error updating driver location:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  }

  /**
   * Handle driver accepting order
   */
  private async handleDriverAcceptOrder(
    socket: AuthenticatedSocket,
    data: { orderId: string }
  ) {
    try {
      const driver = await prisma.driver.findUnique({
        where: { userId: socket.userId },
      });

      if (!driver) {
        socket.emit('error', { message: 'Driver not found' });
        return;
      }

      // This would typically call OrderService.updateOrderStatus
      // For now, just emit to relevant parties
      this.io.to(`order:${data.orderId}`).emit('order:accepted', {
        orderId: data.orderId,
        driverId: driver.id,
        timestamp: new Date(),
      });

      logger.info(`Driver ${driver.id} accepted order ${data.orderId}`);
    } catch (error) {
      logger.error('Error accepting order:', error);
      socket.emit('error', { message: 'Failed to accept order' });
    }
  }

  /**
   * Handle driver order status updates
   */
  private async handleDriverOrderStatus(
    socket: AuthenticatedSocket,
    data: { orderId: string; status: string }
  ) {
    try {
      // Broadcast status update to order room
      this.io.to(`order:${data.orderId}`).emit('order:status:update', {
        orderId: data.orderId,
        status: data.status,
        timestamp: new Date(),
      });

      logger.info(`Order ${data.orderId} status updated to ${data.status}`);
    } catch (error) {
      logger.error('Error updating order status:', error);
      socket.emit('error', { message: 'Failed to update order status' });
    }
  }

  /**
   * Handle customer tracking order
   */
  private async handleCustomerTrackOrder(
    socket: AuthenticatedSocket,
    data: { orderId: string }
  ) {
    try {
      // Verify customer owns this order
      const order = await prisma.order.findFirst({
        where: {
          id: data.orderId,
          customerId: socket.userId,
        },
        include: {
          delivery: {
            include: {
              driver: true,
              trackingPoints: {
                orderBy: { timestamp: 'desc' },
                take: 1,
              },
            },
          },
        },
      });

      if (!order) {
        socket.emit('error', { message: 'Order not found' });
        return;
      }

      // Join order room
      socket.join(`order:${data.orderId}`);

      // Send current order status
      socket.emit('order:status', {
        orderId: order.id,
        status: order.status,
        delivery: order.delivery,
      });

      // If there's an active delivery, send latest driver location
      if (order.delivery?.driver && order.delivery.trackingPoints.length > 0) {
        const latestLocation = order.delivery.trackingPoints[0];
        socket.emit('driver:location', {
          latitude: Number(latestLocation.latitude),
          longitude: Number(latestLocation.longitude),
          timestamp: latestLocation.timestamp,
        });
      }

      logger.info(`Customer tracking order: ${data.orderId}`);
    } catch (error) {
      logger.error('Error tracking order:', error);
      socket.emit('error', { message: 'Failed to track order' });
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(socket: AuthenticatedSocket) {
    logger.info(`Client disconnected: ${socket.id} - User: ${socket.userId}`);

    // Remove from connected users
    if (socket.userId) {
      this.connectedUsers.delete(socket.userId);

      // If driver, update status
      if (socket.userRole === 'DRIVER') {
        prisma.driver.findUnique({
          where: { userId: socket.userId },
        }).then((driver) => {
          if (driver) {
            this.driverSockets.delete(driver.id);
            // Update driver status to OFFLINE
            prisma.driver.update({
              where: { id: driver.id },
              data: { status: 'OFFLINE' },
            });
          }
        });
      }
    }
  }

  /**
   * Emit notification to user
   */
  public emitToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      logger.debug(`Emitted ${event} to user ${userId}`);
    }
  }

  /**
   * Emit to order room
   */
  public emitToOrder(orderId: string, event: string, data: any) {
    this.io.to(`order:${orderId}`).emit(event, data);
    logger.debug(`Emitted ${event} to order ${orderId}`);
  }

  /**
   * Emit to restaurant
   */
  public emitToRestaurant(restaurantId: string, event: string, data: any) {
    this.io.to(`restaurant:${restaurantId}`).emit(event, data);
    logger.debug(`Emitted ${event} to restaurant ${restaurantId}`);
  }

  /**
   * Get Socket.io instance
   */
  public getIO(): SocketServer {
    return this.io;
  }
}
