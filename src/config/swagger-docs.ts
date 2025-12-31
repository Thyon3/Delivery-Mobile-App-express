/**
 * Swagger Documentation Definitions
 */

export const swaggerDefinitions = {
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      role: { type: 'string', enum: ['CUSTOMER', 'DRIVER', 'RESTAURANT_OWNER', 'ADMIN'] },
      phone: { type: 'string' },
      isEmailVerified: { type: 'boolean' },
      isPhoneVerified: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
  Restaurant: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      description: { type: 'string' },
      cuisineTypes: { type: 'array', items: { type: 'string' } },
      rating: { type: 'number' },
      deliveryFee: { type: 'number' },
      minimumOrder: { type: 'number' },
      isOpen: { type: 'boolean' },
      estimatedDeliveryTime: { type: 'integer' },
    },
  },
  MenuItem: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      description: { type: 'string' },
      price: { type: 'number' },
      discountPrice: { type: 'number' },
      isAvailable: { type: 'boolean' },
      isVegetarian: { type: 'boolean' },
      isVegan: { type: 'boolean' },
    },
  },
  Order: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      orderNumber: { type: 'string' },
      status: { 
        type: 'string', 
        enum: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] 
      },
      subtotal: { type: 'number' },
      deliveryFee: { type: 'number' },
      tax: { type: 'number' },
      totalAmount: { type: 'number' },
      paymentMethod: { type: 'string', enum: ['CARD', 'CASH', 'WALLET'] },
      paymentStatus: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED'] },
      createdAt: { type: 'string', format: 'date-time' },
    },
  },
};
