#!/bin/bash

# Delivery App - Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Delivery App Backend..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18 or higher is required${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js version OK${NC}"

# Check if PostgreSQL is installed
echo "🗄️  Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}Warning: PostgreSQL not found. Please install PostgreSQL 14+${NC}"
else
    echo -e "${GREEN}✓ PostgreSQL found${NC}"
fi

# Check if Redis is installed
echo "📊 Checking Redis..."
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}Warning: Redis not found. Please install Redis 6+${NC}"
else
    echo -e "${GREEN}✓ Redis found${NC}"
fi

# Install dependencies
echo "📥 Installing dependencies..."
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Setup environment file
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}Please update .env with your configuration${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run prisma:generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"

# Create logs directory
if [ ! -d logs ]; then
    echo "📝 Creating logs directory..."
    mkdir logs
    echo -e "${GREEN}✓ Logs directory created${NC}"
fi

# Create uploads directory
if [ ! -d uploads ]; then
    echo "📁 Creating uploads directory..."
    mkdir uploads
    echo -e "${GREEN}✓ Uploads directory created${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Create database: createdb delivery_db"
echo "3. Enable PostGIS: psql delivery_db -c \"CREATE EXTENSION postgis;\""
echo "4. Run migrations: npm run prisma:migrate"
echo "5. Start development server: npm run dev"
echo ""
echo "Happy coding! 🎉"
