#!/bin/bash

# Production deployment script for LitXplore backend

echo "Deploying LitXplore backend in production mode..."

# Set production environment
export PRODUCTION=true
export BEHIND_PROXY=true

# Pull latest changes if in git repository
if [ -d ".git" ]; then
  echo "Pulling latest changes from git..."
  git pull
fi

# Clean up Docker system to free space
echo "Cleaning up Docker system to free space..."
docker system prune -f --volumes

# Build and start containers using production configuration
echo "Building and starting containers..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache --force-rm
docker-compose -f docker-compose.prod.yml up -d

echo "Deployment complete! Backend should now be running behind Nginx proxy."
echo "Remember to check the logs with: docker-compose -f docker-compose.prod.yml logs -f api"
