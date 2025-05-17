#!/bin/bash
set -e

# Production deployment script for LitXplore backend with zero-downtime

echo "Deploying LitXplore backend in production mode (zero-downtime)..."

# Set production environment
export PRODUCTION=true
export BEHIND_PROXY=true

# Pull latest changes if in git repository
if [ -d ".git" ]; then
  echo "Pulling latest changes from git..."
  git pull
fi

# Build new image without affecting the running container
echo "Building new backend image..."
docker-compose -f docker-compose.prod.yml build api

# Pull the latest images for other services
echo "Pulling latest images for supporting services..."
docker-compose -f docker-compose.prod.yml pull db redis

# Apply database migrations if needed (add this if you have migrations to run)
# echo "Running database migrations..."
# docker-compose -f docker-compose.prod.yml exec -T api alembic upgrade head

# Recreate only the backend container with zero-downtime
echo "Deploying new backend container (zero-downtime)..."
docker-compose -f docker-compose.prod.yml up -d --no-deps --build api

# Check if deployment was successful
echo "Waiting for health check to pass..."
sleep 10

HEALTH_STATUS=$(curl -s http://localhost:8000/health | grep -c "healthy" || echo "0")

if [ "$HEALTH_STATUS" -gt 0 ]; then
  echo "✅ New backend deployed successfully!"
  # Clean up old images to save space
  echo "Cleaning up old unused images..."
  docker image prune -f
else
  echo "❌ Deployment may have failed! Check logs with: docker-compose -f docker-compose.prod.yml logs -f api"
fi

echo "Deployment process complete."
echo "Remember to check the logs with: docker-compose -f docker-compose.prod.yml logs -f api"
