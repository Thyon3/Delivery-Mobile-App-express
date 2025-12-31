# Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### npm install fails
**Problem**: Dependencies installation fails

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Install again
npm install
```

#### PostGIS extension error
**Problem**: PostgreSQL doesn't have PostGIS

**Solution**:
```bash
# Install PostGIS
# Ubuntu/Debian
sudo apt-get install postgis postgresql-14-postgis-3

# macOS
brew install postgis

# Enable in database
psql your_database -c "CREATE EXTENSION postgis;"
```

### Runtime Issues

#### Port already in use
**Problem**: Error: listen EADDRINUSE :::5000

**Solution**:
```bash
# Find process using port
lsof -i :5000
# or
netstat -ano | findstr :5000

# Kill the process
kill -9 <PID>
```

#### Database connection fails
**Problem**: Cannot connect to PostgreSQL

**Solutions**:
1. Check DATABASE_URL in .env
2. Ensure PostgreSQL is running:
   ```bash
   # Check status
   sudo service postgresql status
   
   # Start if not running
   sudo service postgresql start
   ```
3. Verify credentials
4. Check if database exists

#### Redis connection fails
**Problem**: Redis connection error

**Solutions**:
1. Check if Redis is running:
   ```bash
   redis-cli ping
   # Should return PONG
   ```
2. Start Redis:
   ```bash
   redis-server
   ```
3. Check REDIS_HOST and REDIS_PORT in .env

### Migration Issues

#### Prisma migration fails
**Problem**: Migration errors

**Solutions**:
```bash
# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# Apply migrations manually
npx prisma migrate deploy

# Regenerate Prisma Client
npx prisma generate
```

#### Migration out of sync
**Problem**: Migrations don't match database

**Solution**:
```bash
# Mark migrations as applied
npx prisma migrate resolve --applied <migration_name>

# Create new migration from current schema
npx prisma migrate dev
```

### Socket.io Issues

#### WebSocket connection fails
**Problem**: Real-time features not working

**Solutions**:
1. Check CORS configuration
2. Verify JWT token is being sent
3. Check firewall/proxy settings
4. Ensure Socket.io server is running

### Performance Issues

#### Slow queries
**Problem**: API responses are slow

**Solutions**:
1. Check database indexes:
   ```sql
   EXPLAIN ANALYZE your_query;
   ```
2. Enable query logging in Prisma
3. Check Redis cache hit rates
4. Review N+1 query problems

#### High memory usage
**Problem**: Application consuming too much memory

**Solutions**:
1. Check for memory leaks
2. Increase Node.js memory limit:
   ```bash
   node --max-old-space-size=4096 dist/server.js
   ```
3. Review connection pooling settings
4. Check for large data processing

### Docker Issues

#### Container fails to start
**Problem**: Docker container exits immediately

**Solutions**:
```bash
# Check logs
docker logs <container_name>

# Run interactively
docker run -it <image_name> /bin/sh

# Check environment variables
docker exec <container_name> env
```

#### Cannot connect to database from container
**Problem**: Container can't reach database

**Solutions**:
1. Use `host.docker.internal` instead of `localhost`
2. Check Docker network configuration
3. Verify DATABASE_URL

### Testing Issues

#### Tests fail
**Problem**: Test suite has errors

**Solutions**:
```bash
# Run specific test
npm test -- path/to/test.ts

# Run with verbose output
npm test -- --verbose

# Clear Jest cache
npm test -- --clearCache
```

### Build Issues

#### TypeScript compilation errors
**Problem**: Build fails with type errors

**Solutions**:
```bash
# Clean build
rm -rf dist

# Rebuild
npm run build

# Check TypeScript version
npx tsc --version
```

## Still Having Issues?

1. Check the [FAQ](./FAQ.md)
2. Search existing [GitHub Issues](https://github.com/yourusername/delivery-api/issues)
3. Ask in discussions
4. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Logs
