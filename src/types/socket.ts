/**
 * Socket.io Type Definitions
 */

export interface DriverLocationUpdate {
  latitude: number;
  longitude: number;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: string;
  timestamp: Date;
}

export interface DriverAcceptOrder {
  orderId: string;
  driverId: string;
}

export interface CustomerTrackOrder {
  orderId: string;
}

export interface SocketEvents {
  // Driver events
  'driver:location:update': (data: DriverLocationUpdate) => void;
  'driver:order:accept': (data: { orderId: string }) => void;
  'driver:order:status': (data: { orderId: string; status: string }) => void;
  
  // Customer events
  'customer:track:order': (data: CustomerTrackOrder) => void;
  
  // Broadcast events
  'driver:location': (data: DriverLocationUpdate & { timestamp: Date }) => void;
  'order:status:update': (data: OrderStatusUpdate) => void;
  'order:accepted': (data: { orderId: string; driverId: string; timestamp: Date }) => void;
  
  // Connection events
  'ping': () => void;
  'pong': () => void;
  'error': (error: { message: string }) => void;
}
