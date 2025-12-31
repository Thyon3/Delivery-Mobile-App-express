/**
 * Order Type Definitions
 */

export interface CreateOrderInput {
  customerId: string;
  restaurantId: string;
  items: OrderItemInput[];
  deliveryAddressId: string;
  paymentMethod: 'CARD' | 'CASH' | 'WALLET' | 'UPI';
  specialInstructions?: string;
}

export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  addons?: any;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: string;
  notes?: string;
}

export interface OrderCancellation {
  orderId: string;
  reason: string;
}

export interface OrderFilters {
  status?: string;
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}
