# API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

## Endpoints Overview

### Authentication (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `POST /auth/send-email-otp` - Send email OTP
- `POST /auth/verify-email` - Verify email with OTP
- `POST /auth/send-phone-otp` - Send phone OTP
- `POST /auth/verify-phone` - Verify phone with OTP

### Restaurants (`/restaurants`)
- `GET /restaurants/nearby` - Find nearby restaurants
- `GET /restaurants/:id` - Get restaurant details
- `POST /restaurants` - Create restaurant (Restaurant Owner)
- `PUT /restaurants/:id` - Update restaurant (Restaurant Owner)
- `POST /restaurants/:id/categories` - Create category
- `POST /restaurants/:id/menu-items` - Create menu item
- `PUT /menu-items/:id` - Update menu item
- `DELETE /menu-items/:id` - Delete menu item
- `GET /restaurants/:id/orders` - Get restaurant orders
- `GET /restaurants/:id/stats` - Get restaurant statistics

### Orders (`/orders`)
- `POST /orders` - Create new order
- `GET /orders/:id` - Get order details
- `GET /orders/my-orders` - Get user's orders
- `PUT /orders/:id/status` - Update order status
- `POST /orders/:id/cancel` - Cancel order

### Payments (`/payments`)
- `POST /payments/create-intent` - Create Stripe payment intent
- `POST /payments/webhook` - Stripe webhook (no auth)
- `POST /payments/cash` - Process cash payment
- `POST /payments/refund` - Process refund
- `POST /payments/wallet/add` - Add funds to wallet

### Users (`/users`)
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update profile
- `GET /users/addresses` - Get user addresses
- `POST /users/addresses` - Create address
- `DELETE /users/addresses/:id` - Delete address
- `GET /users/wallet/balance` - Get wallet balance
- `GET /users/wallet/transactions` - Get wallet transactions

### Drivers (`/drivers`)
- `POST /drivers/complete-registration` - Complete driver setup
- `GET /drivers/profile` - Get driver profile
- `PUT /drivers/status` - Update driver status
- `GET /drivers/deliveries` - Get driver deliveries
- `GET /drivers/earnings` - Get driver earnings

### Reviews (`/reviews`)
- `GET /reviews/restaurant/:restaurantId` - Get restaurant reviews
- `POST /reviews` - Create review
- `PUT /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review
- `POST /reviews/:id/response` - Add restaurant response

### Search (`/search`)
- `GET /search/restaurants?q=pizza` - Search restaurants
- `GET /search/menu-items?q=burger` - Search menu items
- `GET /search/popular` - Get popular searches

### Notifications (`/notifications`)
- `GET /notifications` - Get user notifications
- `GET /notifications/unread-count` - Get unread count
- `PUT /notifications/:id/read` - Mark as read
- `PUT /notifications/read-all` - Mark all as read
- `DELETE /notifications/:id` - Delete notification

### Analytics (`/analytics`) - Admin Only
- `GET /analytics/platform-stats` - Platform statistics
- `GET /analytics/order-stats` - Order statistics by status
- `GET /analytics/top-restaurants` - Top performing restaurants
- `GET /analytics/revenue-trend` - Revenue trend

## Common Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "statusCode": 200
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error",
  "statusCode": 400
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "statusCode": 200
}
```

## Example Requests

### Register User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  }'
```

### Find Nearby Restaurants
```bash
curl -X GET "http://localhost:5000/api/v1/restaurants/nearby?latitude=40.7128&longitude=-74.0060&radius=5"
```

### Create Order
```bash
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "uuid",
    "items": [
      {
        "menuItemId": "uuid",
        "quantity": 2
      }
    ],
    "deliveryAddressId": "uuid",
    "paymentMethod": "CARD"
  }'
```

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Driver Location Update
```javascript
socket.emit('driver:location:update', {
  latitude: 40.7128,
  longitude: -74.0060
});
```

### Track Order
```javascript
socket.emit('customer:track:order', {
  orderId: 'order-uuid'
});

socket.on('driver:location', (data) => {
  console.log(data); // { latitude, longitude, timestamp }
});
```

## Rate Limits

- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Order creation: 10 requests per minute
- Payment endpoints: 5 requests per minute

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

For detailed interactive documentation, visit:
```
http://localhost:5000/api-docs
```
