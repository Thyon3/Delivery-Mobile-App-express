# GraphQL API Documentation

## Endpoint

```
POST /graphql
```

GraphiQL interface available at `/graphql` in development mode.

## Authentication

Include JWT token in headers:
```
Authorization: Bearer <your_access_token>
```

## Queries

### Get Current User
```graphql
query {
  me {
    id
    email
    firstName
    lastName
    role
  }
}
```

### Search Restaurants
```graphql
query SearchRestaurants($lat: Float!, $lng: Float!, $radius: Float) {
  restaurants(latitude: $lat, longitude: $lng, radius: $radius) {
    id
    name
    cuisineTypes
    rating
    deliveryFee
    isOpen
  }
}
```

### Get Restaurant with Menu
```graphql
query GetRestaurant($id: ID!) {
  restaurant(id: $id) {
    id
    name
    description
    rating
    categories {
      id
      name
      menuItems {
        id
        name
        price
        discountPrice
        isAvailable
        addons {
          id
          name
          price
        }
      }
    }
  }
}
```

### Get My Orders
```graphql
query MyOrders($status: OrderStatus) {
  myOrders(status: $status) {
    id
    orderNumber
    status
    totalAmount
    createdAt
    restaurant {
      name
    }
    items {
      quantity
      price
      menuItem {
        name
      }
    }
  }
}
```

### Get Order Details
```graphql
query GetOrder($id: ID!) {
  order(id: $id) {
    id
    orderNumber
    status
    subtotal
    deliveryFee
    tax
    totalAmount
    paymentMethod
    paymentStatus
    estimatedDeliveryTime
    customer {
      firstName
      lastName
    }
    restaurant {
      name
      address
    }
    items {
      quantity
      price
      menuItem {
        name
        image
      }
    }
    delivery {
      driver {
        firstName
        lastName
      }
      distance
      assignedAt
    }
  }
}
```

### Get Restaurant Reviews
```graphql
query GetReviews($restaurantId: ID!, $limit: Int) {
  reviews(restaurantId: $restaurantId, limit: $limit) {
    id
    rating
    comment
    response
    createdAt
    customer {
      firstName
      lastName
    }
  }
}
```

## Mutations

### Register User
```graphql
mutation Register($input: RegisterInput!) {
  register(input: $input) {
    user {
      id
      email
      firstName
      lastName
    }
    accessToken
    refreshToken
  }
}
```

Variables:
```json
{
  "input": {
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  }
}
```

### Login
```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    user {
      id
      email
      role
    }
    accessToken
    refreshToken
  }
}
```

### Create Order
```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    id
    orderNumber
    status
    totalAmount
  }
}
```

Variables:
```json
{
  "input": {
    "restaurantId": "restaurant-uuid",
    "items": [
      {
        "menuItemId": "item-uuid",
        "quantity": 2
      }
    ],
    "deliveryAddressId": "address-uuid",
    "paymentMethod": "CARD"
  }
}
```

### Update Order Status
```graphql
mutation UpdateOrderStatus($orderId: ID!, $status: OrderStatus!) {
  updateOrderStatus(orderId: $orderId, status: $status) {
    id
    orderNumber
    status
  }
}
```

### Cancel Order
```graphql
mutation CancelOrder($orderId: ID!, $reason: String!) {
  cancelOrder(orderId: $orderId, reason: $reason) {
    id
    status
  }
}
```

### Create Review
```graphql
mutation CreateReview($input: CreateReviewInput!) {
  createReview(input: $input) {
    id
    rating
    comment
    createdAt
  }
}
```

Variables:
```json
{
  "input": {
    "restaurantId": "restaurant-uuid",
    "rating": 5,
    "comment": "Great food!"
  }
}
```

### Create Restaurant
```graphql
mutation CreateRestaurant($input: CreateRestaurantInput!) {
  createRestaurant(input: $input) {
    id
    name
    status
  }
}
```

### Create Menu Item
```graphql
mutation CreateMenuItem($input: CreateMenuItemInput!) {
  createMenuItem(input: $input) {
    id
    name
    price
    isAvailable
  }
}
```

## Subscriptions

### Subscribe to Order Status Changes
```graphql
subscription OrderStatusChanged($orderId: ID!) {
  orderStatusChanged(orderId: $orderId) {
    id
    status
    updatedAt
  }
}
```

### Subscribe to Driver Location Updates
```graphql
subscription DriverLocationUpdated($orderId: ID!) {
  driverLocationUpdated(orderId: $orderId) {
    latitude
    longitude
    timestamp
  }
}
```

## Types

### Enums

**UserRole**
- CUSTOMER
- DRIVER
- RESTAURANT_OWNER
- ADMIN

**OrderStatus**
- PENDING
- ACCEPTED
- PREPARING
- READY_FOR_PICKUP
- OUT_FOR_DELIVERY
- DELIVERED
- CANCELLED
- REFUNDED

**PaymentMethod**
- CARD
- CASH
- WALLET
- UPI

**PaymentStatus**
- PENDING
- PROCESSING
- COMPLETED
- FAILED
- REFUNDED

## Error Handling

GraphQL returns errors in the following format:

```json
{
  "errors": [
    {
      "message": "Not authenticated",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

Common error codes:
- `UNAUTHENTICATED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `BAD_REQUEST` - Invalid input
- `NOT_FOUND` - Resource not found

## Best Practices

1. **Request only needed fields** to minimize response size
2. **Use fragments** for reusable field selections
3. **Batch queries** when fetching multiple resources
4. **Use variables** instead of inline values
5. **Handle errors** properly in your client code

## Example Fragment

```graphql
fragment RestaurantDetails on Restaurant {
  id
  name
  rating
  deliveryFee
  minimumOrder
  cuisineTypes
  isOpen
}

query {
  restaurants(latitude: 40.7128, longitude: -74.0060) {
    ...RestaurantDetails
  }
}
```

## Rate Limiting

GraphQL endpoint follows the same rate limiting as REST API:
- 100 requests per 15 minutes per IP
- Authenticated users may have higher limits

## Development Tools

Use GraphiQL interface in development:
```
http://localhost:5000/graphql
```

Features:
- Schema explorer
- Query autocompletion
- Documentation browser
- Query history
