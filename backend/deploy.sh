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

# Use a temporary container name for the new version
echo "Starting new container alongside the old one..."

# Remove any previous temporary containers
docker rm -f litxplore_backend_new 2>/dev/null || true

# Start a new container with a different name but same config
docker-compose -f docker-compose.prod.yml run --name litxplore_backend_new -d --service-ports \
  -e DOCKER_ENV=true -e BEHIND_PROXY=true -e PRODUCTION=true \
  api

# Check if new deployment is successful
echo "Waiting for health check to pass on new container..."
sleep 10

# Try the health check on the new container
NEW_CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' litxplore_backend_new)
HEALTH_STATUS=$(curl -s http://$NEW_CONTAINER_IP:8000/health | grep -c "healthy" || echo "0")

if [ "$HEALTH_STATUS" -gt 0 ]; then
  echo "✅ New backend is healthy! Switching traffic..."
  
  # Get the current production container ID if it exists
  OLD_CONTAINER=$(docker ps -q --filter "name=litxplore_backend" --filter "name=backend_api_1" | head -n1)
  
  # If we have an existing container, gracefully switch traffic
  if [ ! -z "$OLD_CONTAINER" ]; then
    echo "Stopping the old container $OLD_CONTAINER gracefully..."
    # Rename the new container to the production name
    docker rename litxplore_backend_new litxplore_backend
    # Stop the old container gracefully
    docker stop -t 10 $OLD_CONTAINER
    docker rm $OLD_CONTAINER
    echo "✅ Zero-downtime deployment complete!"
  else
    # No existing container, just rename the new one
    docker rename litxplore_backend_new litxplore_backend
    echo "✅ Initial deployment complete!"
  fi
  
  # Clean up old images to save space
  echo "Cleaning up old unused images..."
  docker image prune -f
else
  echo "❌ New container failed health check! Rolling back..."
  # Stop and remove the new container
  docker stop litxplore_backend_new
  docker rm litxplore_backend_new
  echo "Deployment rolled back. Check logs for errors."
fi

echo "Deployment process complete."
echo "Remember to check the logs with: docker-compose -f docker-compose.prod.yml logs -f api"
