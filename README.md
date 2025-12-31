# Delivery App - Backend API

Production-ready Express.js REST API for a Multi-vendor Delivery Application supporting Customers, Drivers, and Restaurants.

## 🚀 Features

### Core Features
- **Multi-role Authentication**: JWT-based authentication with refresh tokens, OTP verification
- **Geolocation Services**: PostGIS spatial queries for restaurant search and driver assignment
- **Order State Machine**: Robust order lifecycle with transaction handling and race condition prevention
- **Real-time Tracking**: Socket.io integration for live driver location tracking
- **Payment Integration**: Stripe integration with webhook support
- **Background Jobs**: BullMQ for email, SMS, and payment processing
- **Caching**: Redis for performance optimization

### Technical Highlights
- **TypeScript**: Full type safety
- **Clean Architecture**: Controllers, Services, Repositories pattern
- **Error Handling**: Global error handler with custom error classes
- **Validation**: Zod schema validation
- **Security**: Helmet, CORS, Rate Limiting, SQL Injection prevention
- **Logging**: Winston for production-grade logging
- **Documentation**: Auto-generated Swagger/OpenAPI docs

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL with PostGIS extension
- Redis
- Stripe account (for payments)

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd node
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup PostgreSQL with PostGIS**
```sql
CREATE DATABASE delivery_db;
\c delivery_db
CREATE EXTENSION postgis;
```

5. **Run database migrations**
```bash
npm run prisma:migrate
```

6. **Generate Prisma Client**
```bash
npm run prisma:generate
```

## 🚀 Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:5000/api-docs
- **API Base URL**: http://localhost:5000/api/v1

## 🗂️ Project Structure

```
src/
├── config/           # Configuration files (database, redis, swagger, bullmq)
├── controllers/      # Request handlers
├── services/         # Business logic layer
├── middlewares/      # Express middleware (auth, validation, error handling)
├── routes/          # API route definitions
├── utils/           # Utility functions and helpers
├── types/           # TypeScript type definitions
├── validators/      # Zod validation schemas
└── server.ts        # Application entry point
```

## 🔐 Authentication

The API uses JWT tokens for authentication:

1. **Register/Login** to receive access and refresh tokens
2. Include access token in requests: `Authorization: Bearer <token>`
3. Use refresh token endpoint when access token expires

### Roles
- `CUSTOMER`: Place orders, track deliveries
- `DRIVER`: Accept deliveries, update location
- `RESTAURANT_OWNER`: Manage menu, update order status
- `ADMIN`: Full access

## 📍 Geolocation Features

### Find Nearby Restaurants
```bash
GET /api/v1/restaurants/nearby?latitude=40.7128&longitude=-74.0060&radius=10
```

### Spatial Queries
- Uses PostGIS `ST_DWithin` with GIST indexes for performance
- Calculates delivery fees based on distance
- Finds available drivers within radius

## 📦 Order Flow

1. **Customer places order** → `PENDING`
2. **Restaurant accepts** → `ACCEPTED`
3. **Restaurant prepares** → `PREPARING`
4. **Food ready** → `READY_FOR_PICKUP` (Driver auto-assigned)
5. **Driver picks up** → `OUT_FOR_DELIVERY`
6. **Delivered** → `DELIVERED`

### Race Condition Prevention
- Optimistic locking with version field
- Database transactions for critical operations
- Only one driver can accept an order

## 💳 Payment Integration

### Stripe Integration
```bash
POST /api/v1/payments/create-intent
{
  "orderId": "uuid"
}
```

### Webhook Handling
```bash
POST /api/v1/payments/webhook
# Called by Stripe - signature verified
```

**Important**: Never trust frontend for payment confirmation. Always verify via webhooks.

## 🔄 Real-time Tracking

### Socket.io Events

**Driver Location Update**
```javascript
socket.emit('driver:location:update', {
  latitude: 40.7128,
  longitude: -74.0060
});
```

**Track Order**
```javascript
socket.emit('customer:track:order', {
  orderId: 'uuid'
});

socket.on('driver:location', (data) => {
  console.log(data); // { latitude, longitude, timestamp }
});
```

## 🔧 Background Jobs

Using BullMQ for asynchronous processing:
- Email notifications
- SMS notifications  
- Payment processing
- Order notifications

## 📊 Database Schema

### Key Tables
- `users`: User accounts with multi-role support
- `restaurants`: Restaurant profiles with PostGIS location
- `menu_items`: Menu with categories and addons
- `orders`: Order management with state machine
- `deliveries`: Delivery tracking with driver assignment
- `payments`: Payment records with Stripe integration

## 🛡️ Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting on sensitive endpoints
- SQL injection prevention (Prisma ORM)
- Password hashing with Argon2
- JWT token rotation
- Input validation with Zod

## 📈 Performance Optimizations

- Redis caching for frequently accessed data
- Efficient SQL joins to prevent N+1 queries
- PostGIS spatial indexes for location queries
- Connection pooling
- Response compression

## 🧪 Testing

```bash
npm test
```

## 📝 Environment Variables

See `.env.example` for all required environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License

## 🐛 Known Issues & Solutions

### N+1 Query Problem
✅ **Solved**: Using Prisma nested includes with single queries

### Race Conditions
✅ **Solved**: Optimistic locking with version field + database transactions

### Payment Verification
✅ **Solved**: Webhook-based payment confirmation, never trust frontend

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Express.js, TypeScript, PostgreSQL, and Redis
