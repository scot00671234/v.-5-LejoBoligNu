#!/bin/bash

# LejeBoligNu - VPS Deployment Script
# This script automates the deployment process

set -e  # Exit on any error

echo "Starting LejeBoligNu deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please copy .env.example to .env and configure your environment variables."
    exit 1
fi

# Source environment variables
source .env

# Check required environment variables
required_vars=("DATABASE_URL" "JWT_SECRET" "SESSION_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set in .env file"
        exit 1
    fi
done

echo "Environment variables validated"

# Install dependencies
echo "Installing dependencies..."
npm ci --only=production

echo "Building application..."
npm run build

# Check if build was successful
if [ ! -f "dist/index.js" ]; then
    echo "Error: Build failed - dist/index.js not found"
    exit 1
fi

if [ ! -d "dist/public" ]; then
    echo "Error: Build failed - dist/public directory not found"
    exit 1
fi

echo "Build completed successfully"

# Database operations
echo "Setting up database..."
npm run db:push

echo "Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Start the application: npm start"
echo "2. Or use PM2: pm2 start ecosystem.config.js"
echo "3. Configure Nginx (see nginx.conf.example)"
echo "4. Set up SSL certificate"
echo ""
echo "Application will be available at: http://localhost:${PORT:-5000}"