#!/bin/bash

echo "🚀 Starting deployment..."

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build application
echo "🔨 Building application..."
npm run build

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Restart application with PM2
echo "♻️  Restarting application..."
pm2 restart delivery-api

echo "✅ Deployment complete!"
