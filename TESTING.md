# Testing Guide

## Test Structure

Tests are organized by feature:
```
src/
  __tests__/
    unit/
      services/
      utils/
    integration/
      controllers/
      routes/
    e2e/
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm test -- --coverage
```

### Specific Test File
```bash
npm test -- auth.service.test.ts
```

## Test Categories

### Unit Tests
Test individual functions and services in isolation.

Example:
```typescript
describe('GeolocationService', () => {
  it('should calculate distance correctly', () => {
    const distance = GeolocationService.calculateDistance(
      40.7128, -74.0060,
      34.0522, -118.2437
    );
    expect(distance).toBeCloseTo(3935.75, 1);
  });
});
```

### Integration Tests
Test multiple components working together.

Example:
```typescript
describe('Order Creation', () => {
  it('should create order with valid data', async () => {
    const order = await OrderService.createOrder({
      customerId: 'uuid',
      restaurantId: 'uuid',
      items: [...],
      deliveryAddressId: 'uuid',
      paymentMethod: 'CARD'
    });
    
    expect(order.status).toBe('PENDING');
  });
});
```

### E2E Tests
Test complete user flows through API endpoints.

Example:
```typescript
describe('Order Flow E2E', () => {
  it('should complete full order lifecycle', async () => {
    // Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'test' });
    
    const token = loginRes.body.data.accessToken;
    
    // Create order
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ ... });
    
    expect(orderRes.status).toBe(201);
  });
});
```

## Test Database

Use a separate test database:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"
```

Reset database before tests:
```bash
npx prisma migrate reset --force
```

## Mocking

### Mock External Services
```typescript
jest.mock('@/services/payment.service');

describe('Order Payment', () => {
  it('should process payment', async () => {
    PaymentService.createPaymentIntent = jest.fn().mockResolvedValue({
      clientSecret: 'test_secret'
    });
    
    // Test logic
  });
});
```

### Mock Database
```typescript
jest.mock('@/config/database', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  }
}));
```

## Test Data

Use factories for test data:

```typescript
const userFactory = {
  customer: () => ({
    email: 'customer@test.com',
    password: 'Test@123',
    firstName: 'Test',
    lastName: 'User',
    role: 'CUSTOMER'
  })
};
```

## Best Practices

1. **Clear Test Names**: Describe what is being tested
2. **Arrange-Act-Assert**: Follow AAA pattern
3. **Independent Tests**: Tests should not depend on each other
4. **Clean Up**: Reset state after each test
5. **Mock External Dependencies**: Don't call external APIs
6. **Test Edge Cases**: Include error scenarios
7. **Meaningful Assertions**: Test what matters

## Coverage Goals

- Unit Tests: 80%+ coverage
- Integration Tests: Key workflows covered
- E2E Tests: Critical user paths covered

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Deployment pipeline

## Common Test Scenarios

### Authentication
- User registration
- Login with valid/invalid credentials
- Token refresh
- OTP verification

### Orders
- Order creation
- Status transitions
- Cancellation rules
- Race condition prevention

### Payments
- Payment intent creation
- Webhook verification
- Refund processing

### Geolocation
- Distance calculation
- Nearby search
- Delivery fee calculation

## Debugging Tests

### Enable Debug Logging
```bash
DEBUG=* npm test
```

### Run Single Test
```bash
npm test -- -t "test name"
```

### Inspect Failed Tests
```bash
npm test -- --verbose
```

## Performance Testing

Use tools like:
- Apache JMeter
- k6
- Artillery

Example k6 test:
```javascript
import http from 'k6/http';

export default function() {
  http.get('http://localhost:5000/api/v1/health');
}
```

## Future Improvements

- [ ] Increase test coverage to 90%
- [ ] Add load testing
- [ ] Add security testing
- [ ] Automated visual regression testing
- [ ] Contract testing for APIs
