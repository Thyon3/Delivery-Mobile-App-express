#!/bin/bash

echo "🔄 Running database migrations..."

# Check if database is reachable
if ! psql $DATABASE_URL -c "SELECT 1" > /dev/null 2>&1; then
    echo "❌ Database is not reachable"
    exit 1
fi

# Run migrations
npx prisma migrate dev

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
    
    # Generate Prisma Client
    echo "🔧 Generating Prisma Client..."
    npx prisma generate
    
    echo "✅ Setup complete"
else
    echo "❌ Migration failed"
    exit 1
fi
