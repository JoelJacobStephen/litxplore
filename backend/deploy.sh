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

# First, check if any containers are running in the stack
echo "Getting information about the current deployment..."
RUNNING_CONTAINER=$(docker ps -q --filter "name=backend_api_1" --filter "name=litxplore_backend" | head -n1)

# Start the services if they're not already running
if [ -z "$RUNNING_CONTAINER" ]; then
  echo "No existing containers found. Starting the full stack first..."
  docker-compose -f docker-compose.prod.yml up -d
  echo "Waiting for services to initialize..."
  sleep 10
fi

# Start a new container with the newly built image
echo "Starting new container with new image..."
docker run -d --name litxplore_backend_new \
  -e DOCKER_ENV=true -e BEHIND_PROXY=true -e PRODUCTION=true \
  -e POSTGRES_USER=${POSTGRES_USER:-postgres} \
  -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres} \
  -e POSTGRES_DB=${POSTGRES_DB:-litxplore_db} \
  -e POSTGRES_HOST=host.docker.internal \
  -e REDIS_HOST=host.docker.internal \
  --network bridge \
  -p 8001:8000 \
  -v $(pwd)/uploads:/app/uploads \
  litxplore-backend:latest

# Check if new deployment is successful
echo "Waiting for health check to pass on new container..."
sleep 15  # Give the container more time to fully start

# Display container details for debugging
echo "Container details:"
docker ps -a | grep litxplore_backend_new

# For our setup, let's use localhost and the mapped port 8001 to check health
# This is more reliable than trying to determine the container's internal IP
echo "Testing health check at http://localhost:8001/health"
HEALTH_OUTPUT=$(curl -s http://localhost:8001/health || echo "Failed to connect")

# If curl failed completely
if [ "$HEALTH_OUTPUT" = "Failed to connect" ]; then
  echo "Warning: Could not connect to health endpoint"
  
  # Show container logs for debugging
  echo "\nLast 20 lines of container logs:"
  docker logs --tail 20 litxplore_backend_new
fi
HEALTH_STATUS=0

echo "Health check output: $HEALTH_OUTPUT"

if echo "$HEALTH_OUTPUT" | grep -q "healthy"; then
  HEALTH_STATUS=1
fi

echo "Health status: $HEALTH_STATUS"

if [ "$HEALTH_STATUS" = "1" ]; then
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
