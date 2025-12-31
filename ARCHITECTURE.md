# System Architecture & Design

## Database Schema Overview

### Core Tables

#### Users & Authentication
- `users`: Multi-role user accounts (Customer, Driver, Restaurant Owner, Admin)
- `refresh_tokens`: JWT refresh token management
- `otp_verifications`: Email/Phone OTP verification
- `customers`: Customer-specific profile data
- `drivers`: Driver profiles with real-time location tracking
- `restaurant_owners`: Restaurant owner profiles

#### Restaurant & Menu
- `restaurants`: Restaurant profiles with PostGIS location data
- `categories`: Menu categories per restaurant
- `menu_items`: Menu items with pricing and availability
- `menu_item_addons`: Customizable add-ons for menu items

#### Orders & Delivery
- `orders`: Order management with state machine (version field for optimistic locking)
- `order_items`: Line items for each order
- `order_status_history`: Audit trail of status changes
- `deliveries`: Delivery assignments and tracking
- `delivery_tracking`: Real-time driver location history

#### Payments
- `payments`: Payment records with Stripe integration
- `wallet_transactions`: Customer/Driver wallet management

#### Reviews & Addresses
- `reviews`: Restaurant ratings and reviews
- `addresses`: User addresses with PostGIS location data
- `notifications`: Push notification records

### PostGIS Spatial Features

All location-based tables use PostGIS geometry columns:
```sql
location geometry(Point, 4326)
```

Spatial indexes (GIST) enable efficient queries:
```sql
CREATE INDEX idx_restaurants_location ON restaurants USING GIST(location);
CREATE INDEX idx_drivers_location ON drivers USING GIST(currentLocation);
```

## Folder Structure

```
src/
├── config/               # Configuration files
│   ├── database.ts       # Prisma client & connection
│   ├── redis.ts         # Redis client & cache helpers
│   ├── swagger.ts       # OpenAPI documentation
│   └── bullmq.ts        # Background job queues
│
├── controllers/         # Request handlers (thin layer)
│   ├── auth.controller.ts
│   ├── restaurant.controller.ts
│   ├── order.controller.ts
│   └── payment.controller.ts
│
├── services/           # Business logic (thick layer)
│   ├── auth.service.ts
│   ├── geolocation.service.ts
│   ├── order.service.ts
│   ├── payment.service.ts
│   ├── restaurant.service.ts
│   └── socket.service.ts
│
├── middlewares/        # Express middleware
│   ├── auth.ts         # JWT authentication & authorization
│   ├── errorHandler.ts # Global error handling
│   ├── validation.ts   # Zod schema validation
│   └── rateLimiter.ts  # Rate limiting
│
├── routes/            # API route definitions
│   ├── auth.routes.ts
│   ├── restaurant.routes.ts
│   ├── order.routes.ts
│   ├── payment.routes.ts
│   └── index.ts
│
├── utils/             # Utility functions
│   ├── errors/        # Custom error classes
│   ├── logger.ts      # Winston logger
│   ├── asyncHandler.ts
│   └── response.ts
│
├── types/             # TypeScript definitions
│   ├── index.ts
│   └── express.d.ts
│
├── validators/        # Zod validation schemas
│   ├── auth.validator.ts
│   └── order.validator.ts
│
└── server.ts         # Application entry point
```

## Key Design Patterns

### 1. Clean Architecture
- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Repositories**: Data access (Prisma ORM)

### 2. Error Handling
Custom error classes extend `AppError`:
- `BadRequestError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `ValidationError` (422)

### 3. State Machine (Orders)
Valid transitions defined in `OrderService`:
```typescript
PENDING → ACCEPTED → PREPARING → READY_FOR_PICKUP → OUT_FOR_DELIVERY → DELIVERED
         ↓
      CANCELLED
```

Cannot cancel once `PREPARING` starts.

### 4. Optimistic Locking
Orders use version field to prevent race conditions:
```typescript
UPDATE orders 
SET status = 'ACCEPTED', version = version + 1
WHERE id = '...' AND version = currentVersion
```

## Critical Solutions

### Problem 1: N+1 Query Problem
**Solution**: Use Prisma nested includes to load entire menu in single query:
```typescript
const restaurant = await prisma.restaurant.findUnique({
  where: { id },
  include: {
    categories: {
      include: {
        menuItems: {
          include: {
            addons: true
          }
        }
      }
    }
  }
});
```

### Problem 2: Race Conditions (Driver Assignment)
**Solution**: 
1. Optimistic locking with version field
2. Database transactions
3. Lock driver record during assignment

```typescript
await prisma.$transaction(async (tx) => {
  const order = await tx.order.findUnique({ where: { id } });
  
  await tx.order.updateMany({
    where: { id, version: order.version },
    data: { status: 'ACCEPTED', version: { increment: 1 } }
  });
});
```

### Problem 3: Payment Verification
**Solution**: Never trust frontend. Use Stripe webhooks:
```typescript
// Verify webhook signature
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  WEBHOOK_SECRET
);

// Update payment status based on webhook event
if (event.type === 'payment_intent.succeeded') {
  await markOrderAsPaid(orderId);
}
```

## Real-time Architecture

### Socket.io Integration
- **Authentication**: JWT tokens in handshake
- **Rooms**: Users join role-specific rooms
  - `customer:{userId}`
  - `driver:{userId}`
  - `restaurant:{restaurantId}`
  - `order:{orderId}`

### Events
- `driver:location:update`: Driver broadcasts location
- `customer:track:order`: Customer subscribes to order updates
- `order:status:update`: Broadcast order status changes

## Security Measures

1. **Authentication**: JWT with refresh tokens
2. **Rate Limiting**: Different limits per endpoint type
3. **Input Validation**: Zod schemas
4. **SQL Injection**: Prisma ORM + parameterized queries
5. **CORS**: Configurable origins
6. **Helmet**: Security headers
7. **Password Hashing**: Argon2

## Performance Optimizations

1. **Redis Caching**: Restaurant menus cached for 5 minutes
2. **Spatial Indexes**: PostGIS GIST indexes on location columns
3. **Connection Pooling**: Prisma connection pool
4. **Compression**: Gzip response compression
5. **Background Jobs**: BullMQ for async operations

## Monitoring & Logging

### Winston Logger
- Console logs in development
- File logs in production (error.log, combined.log)
- Structured JSON logging
- Request/response logging with Morgan

### Health Checks
```bash
GET /api/v1/health
```

Returns API status and timestamp.
