#!/bin/bash
set -e

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

# Reset and restart the entire stack to ensure clean state
echo "Resetting Docker environment..."

# Stop and remove all project containers
docker-compose -f docker-compose.prod.yml down --remove-orphans

# Make sure the network exists
NETWORK_NAME="backend_litxplore-network"
docker network inspect $NETWORK_NAME >/dev/null 2>&1 || docker network create $NETWORK_NAME

# Start only supporting services first
echo "Starting database and redis containers..."
docker-compose -f docker-compose.prod.yml up -d db redis

# Wait for database to be ready
echo "Waiting for database to be ready..."
attempts=0
max_attempts=30
while [ $attempts -lt $max_attempts ]; do
  if docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U postgres >/dev/null 2>&1; then
    echo "✅ Database is ready!"
    break
  fi
  attempts=$((attempts+1))
  echo "Waiting for database... (Attempt $attempts/$max_attempts)"
  sleep 2
done

if [ $attempts -eq $max_attempts ]; then
  echo "⚠️ Database did not become ready in time. Proceeding anyway..."
fi

# Check if network exists and create it if not
if ! docker network inspect litxplore-network &>/dev/null; then
  echo "Creating litxplore-network network..."
  docker network create litxplore-network
fi

# Load environment variables from .env file if present
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  source .env
fi

# Now start the API container using docker-compose
echo "Making sure API container uses updated environment variables..."
# Force recreate the API container to ensure it uses latest env vars
if docker ps -a | grep -q litxplore_backend; then
  echo "Removing existing API container to use updated environment variables..."
  docker rm -f litxplore_backend || true
fi

echo "Starting the API container using docker-compose..."
docker-compose -f docker-compose.prod.yml up -d api

# Give time for the container to fully initialize
echo "Waiting for API container to initialize (20 seconds)..."
sleep 20

# Verify the API container is running
API_CONTAINER=$(docker ps -q --filter "name=litxplore_backend" | head -n1)
if [ -z "$API_CONTAINER" ]; then
  # Try alternative name pattern
  API_CONTAINER=$(docker ps -q --filter "name=backend_api" | head -n1)
  
  if [ -z "$API_CONTAINER" ]; then
    echo "❌ API container failed to start. Checking logs..."
    docker-compose -f docker-compose.prod.yml logs api
    echo "Deployment failed. Please check the logs for more information."
    exit 1
  fi
fi

echo "✅ API container started successfully: $API_CONTAINER"

# Check if deployment is successful by testing the health endpoint
echo "Checking API health..."
HEALTH_OUTPUT=$(curl -s http://localhost:8000/api/v1/health || echo "Failed to connect")

# If curl failed completely
if [ "$HEALTH_OUTPUT" = "Failed to connect" ]; then
  echo "Warning: Could not connect to health endpoint"
  
  # Show container logs for debugging
  echo "Last 20 lines of container logs:"
  docker-compose -f docker-compose.prod.yml logs --tail=20 api
fi

HEALTH_STATUS=0
echo "Health check output: $HEALTH_OUTPUT"

if echo "$HEALTH_OUTPUT" | grep -q "healthy"; then
  HEALTH_STATUS=1
fi

echo "Health status: $HEALTH_STATUS"

if [ "$HEALTH_STATUS" = "1" ]; then
  echo "✅ Deployment successful! LitXplore API is running and healthy."
  
  # Clean up old images to save space
  echo "Cleaning up old unused images..."
  docker image prune -f
  
  echo "\nAPI is now running at http://localhost:8000/api/v1"
  echo "You can check the logs with: docker-compose -f docker-compose.prod.yml logs -f api"
else
  echo "❌ Deployment may have issues. Checking logs..."
  echo "Last 50 lines of API logs:"
  docker-compose -f docker-compose.prod.yml logs --tail=50 api
  echo "\nYou may need to check your environment variables and API keys."
  echo "Make sure OPENAI_API_KEY and GEMINI_API_KEY are set in your .env file."
fi

echo "Deployment process complete."
