# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ with PostGIS extension
- Redis 6+
- Stripe account for payments
- (Optional) Docker and Docker Compose

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the following critical variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: Strong random string for JWT signing
- `JWT_REFRESH_SECRET`: Another strong random string
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret

### 3. Setup Database

```bash
# Create database
createdb delivery_db

# Enable PostGIS extension
psql delivery_db -c "CREATE EXTENSION postgis;"

# Run migrations
npm run prisma:migrate

# Generate Prisma Client
npm run prisma:generate
```

### 4. Start Redis

```bash
redis-server
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### 6. Start Workers (Separate Terminal)

```bash
ts-node src/workers/index.ts
```

## Docker Deployment

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Production Build

```bash
# Build image
docker build -t delivery-api .

# Run container
docker run -d \
  -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_HOST="redis" \
  --name delivery-api \
  delivery-api
```

## Production Deployment

### 1. Build for Production

```bash
npm run build
```

### 2. Run Migrations

```bash
npm run prisma:migrate
```

### 3. Start Application

```bash
npm start
```

### 4. Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/server.js --name delivery-api

# Start workers
pm2 start dist/workers/index.js --name delivery-workers

# Save PM2 configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

## Environment-Specific Configurations

### Development
- Debug logging enabled
- Console logs
- Hot reload with nodemon

### Production
- File-based logging
- Error tracking
- Performance monitoring
- Rate limiting enforced
- CORS restrictions

## Database Migrations

### Create a new migration

```bash
npx prisma migrate dev --name <migration_name>
```

### Apply migrations in production

```bash
npx prisma migrate deploy
```

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:5000/api/v1/health
```

### Logs

Logs are stored in `./logs` directory:
- `error.log`: Error logs
- `combined.log`: All logs

### Performance Monitoring

Consider integrating:
- New Relic
- Datadog
- Sentry for error tracking

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use NGINX or AWS ALB
2. **Multiple Instances**: Run multiple API instances
3. **Shared Redis**: Use Redis Cluster or AWS ElastiCache
4. **Database**: Use read replicas for heavy read operations

### Worker Scaling

Run multiple worker instances:

```bash
pm2 start dist/workers/index.js -i 4 --name delivery-workers
```

## Backup Strategy

### Database Backups

```bash
# Backup
pg_dump delivery_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
psql delivery_db < backup_20240101_120000.sql
```

### Automated Backups

Use cron jobs or cloud provider backup services.

## Security Checklist

- [ ] Strong JWT secrets configured
- [ ] HTTPS enabled (use Let's Encrypt)
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Database credentials secured
- [ ] Stripe webhook signature verification enabled
- [ ] Environment variables not committed
- [ ] Regular security updates

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Redis Connection Issues

```bash
# Test connection
redis-cli ping
```

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

## Performance Optimization

1. **Enable Connection Pooling**: Already configured in Prisma
2. **Redis Caching**: Restaurant menus cached for 5 minutes
3. **Database Indexes**: PostGIS GIST indexes on location columns
4. **Compression**: Gzip enabled for responses
5. **CDN**: Use CDN for static assets

## CI/CD Pipeline Example

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - name: Deploy to production
        run: |
          # Your deployment script
```

## Support

For issues and questions:
- Check logs in `./logs` directory
- Review error messages
- Check database and Redis connectivity
- Verify environment variables
