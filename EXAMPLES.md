# API Usage Examples

## Authentication Examples

### Register a New User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "CUSTOMER"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## Restaurant Examples

### Search Nearby Restaurants
```bash
curl -X GET "http://localhost:5000/api/v1/restaurants/nearby?latitude=40.7128&longitude=-74.0060&radius=5&cuisineTypes=Italian,Pizza"
```

### Get Restaurant Menu
```bash
curl -X GET "http://localhost:5000/api/v1/restaurants/{restaurant_id}?includeMenu=true"
```

## Order Examples

### Create Order
```bash
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "restaurant-uuid",
    "items": [
      {
        "menuItemId": "item-uuid",
        "quantity": 2,
        "addons": [
          {"name": "Extra Cheese", "price": 2.00}
        ]
      }
    ],
    "deliveryAddressId": "address-uuid",
    "paymentMethod": "CARD",
    "specialInstructions": "Ring doorbell"
  }'
```

### Track Order
```javascript
// Using Socket.io client
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_ACCESS_TOKEN' }
});

// Track order
socket.emit('customer:track:order', { orderId: 'order-uuid' });

// Listen for updates
socket.on('driver:location', (data) => {
  console.log('Driver location:', data);
});

socket.on('order:status:update', (data) => {
  console.log('Order status:', data);
});
```

## Payment Examples

### Create Payment Intent
```bash
curl -X POST http://localhost:5000/api/v1/payments/create-intent \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-uuid"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_...",
    "clientSecret": "pi_...secret...",
    "payment": {
      "id": "payment-uuid",
      "amount": 45.99,
      "status": "PENDING"
    }
  }
}
```

## Driver Examples

### Update Driver Location
```javascript
socket.emit('driver:location:update', {
  latitude: 40.7128,
  longitude: -74.0060
});
```

### Accept Order
```bash
curl -X PUT http://localhost:5000/api/v1/orders/{order_id}/status \
  -H "Authorization: Bearer DRIVER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACCEPTED",
    "notes": "On my way to restaurant"
  }'
```

## Search Examples

### Search Restaurants
```bash
curl -X GET "http://localhost:5000/api/v1/search/restaurants?q=pizza&minRating=4"
```

### Search Menu Items
```bash
curl -X GET "http://localhost:5000/api/v1/search/menu-items?q=burger&restaurantId=restaurant-uuid"
```

## Admin Examples

### Get Platform Statistics
```bash
curl -X GET "http://localhost:5000/api/v1/analytics/platform-stats?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Get Top Restaurants
```bash
curl -X GET "http://localhost:5000/api/v1/analytics/top-restaurants?limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## File Upload Examples

### Upload Profile Image
```bash
curl -X POST http://localhost:5000/api/v1/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

Response:
```json
{
  "success": true,
  "data": {
    "filename": "profile_1234567890_abc123.jpg",
    "url": "http://localhost:5000/uploads/profile_1234567890_abc123.jpg",
    "mimetype": "image/jpeg",
    "size": 245678
  }
}
```

## Error Handling Examples

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ],
  "statusCode": 422
}
```

### Authentication Error
```json
{
  "success": false,
  "message": "Invalid token",
  "error": "Authentication failed",
  "statusCode": 401
}
```

## Pagination Example

### Get Orders with Pagination
```bash
curl -X GET "http://localhost:5000/api/v1/orders/my-orders?page=2&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 2,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPreviousPage": true
    }
  }
}
```
