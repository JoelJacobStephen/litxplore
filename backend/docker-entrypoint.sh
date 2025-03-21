#!/bin/bash
set -e

# Setup environment vars for Docker
if [ "$DOCKER_ENV" = "true" ]; then
  echo "Running in Docker environment, adjusting configuration..."
  
  # Determine if we're running behind a proxy
  if [ "$PRODUCTION" = "true" ] || [ "$BEHIND_PROXY" = "true" ]; then
    echo "Running in production mode behind a proxy, disabling FastAPI CORS middleware"
    export BEHIND_PROXY="true"
    export PRODUCTION="true"
  else
    echo "Running in development mode, enabling FastAPI CORS middleware"
    export BEHIND_PROXY="false"
    export PRODUCTION="false"
  fi
  
  # Create .env file if it doesn't exist
  if [ ! -f .env ]; then
    echo "Creating .env file from environment variables"
    
    # Create basic .env from environment variables
    cat > .env << EOL
# API Settings
API_V1_STR=${API_V1_STR:-/api/v1}
PROJECT_NAME=${PROJECT_NAME:-LitXplore}

# CORS Settings
CORS_ORIGINS=["http://localhost:3000", "https://litxplore.tech", "https://litxplore.vercel.app"]
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=["GET","POST","PUT","DELETE"]
CORS_ALLOW_HEADERS=["*"]

# Database Settings
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
POSTGRES_HOST=db
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_DB=${POSTGRES_DB:-litxplore_db}

# Redis Settings
REDIS_HOST=redis
REDIS_PORT=${REDIS_PORT:-6379}
REDIS_PASSWORD=${REDIS_PASSWORD:-optional-password}

# Clerk Authentication Settings
CLERK_ISSUER=${CLERK_ISSUER:-https://warm-ram-79.clerk.accounts.dev}
CLERK_FRONTEND_API=${CLERK_FRONTEND_API:-https://warm-ram-79.clerk.accounts.dev}
CLERK_JWKS_URL=${CLERK_JWKS_URL:-https://warm-ram-79.clerk.accounts.dev/.well-known/jwks.json}
CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}
JWT_ALGORITHM=RS256

# LangChain Settings
CHUNK_SIZE=${CHUNK_SIZE:-1000}
CHUNK_OVERLAP=${CHUNK_OVERLAP:-200}
SIMILARITY_THRESHOLD=${SIMILARITY_THRESHOLD:-0.75}
MAX_PAPERS=${MAX_PAPERS:-10}

# Rate Limiting
RATE_LIMIT_PER_DAY=${RATE_LIMIT_PER_DAY:-100}

# Deployment Settings
BEHIND_PROXY=${BEHIND_PROXY:-"false"}
PRODUCTION=${PRODUCTION:-"false"}

# API Keys
GEMINI_API_KEY=${GEMINI_API_KEY}
OPENAI_API_KEY=${OPENAI_API_KEY}
EOL
  else
    # If .env exists, update values as needed
    # Check if POSTGRES_HOST is set to localhost and update it
    if grep -q "POSTGRES_HOST=localhost" .env; then
      echo "Updating POSTGRES_HOST in .env to 'db'"
      sed -i.bak 's/POSTGRES_HOST=localhost/POSTGRES_HOST=db/g' .env && rm -f .env.bak
    fi
    
    # Ensure CORS settings include frontend URLs
    if ! grep -q "litxplore.tech" .env; then
      echo "Adding litxplore.tech to CORS_ORIGINS"
      sed -i.bak 's/CORS_ORIGINS=\[\([^]]*\)\]/CORS_ORIGINS=[\\1,"https:\/\/litxplore.tech"]/g' .env && rm -f .env.bak
    fi
    
    # Ensure Redis host is set correctly
    if ! grep -q "REDIS_HOST=redis" .env; then
      echo "Updating REDIS_HOST in .env to 'redis'"
      sed -i.bak 's/REDIS_HOST=.*/REDIS_HOST=redis/g' .env && rm -f .env.bak
    fi
  fi

  # Print out the settings we're using (omit sensitive values)
  echo "Current settings:"
  grep -v "_KEY\|PASSWORD" .env || echo "Could not read .env file"
fi

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."

# Maximum number of attempts
MAX_ATTEMPTS=30

# Counter for attempts
ATTEMPTS=0

# Wait until PostgreSQL is ready or max attempts reached
while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  if pg_isready -h db -p 5432 -U $POSTGRES_USER; then
    echo "PostgreSQL is ready!"
    break
  fi
  
  echo "PostgreSQL is not ready yet. Waiting... (Attempt $((ATTEMPTS+1))/$MAX_ATTEMPTS)"
  ATTEMPTS=$((ATTEMPTS+1))
  sleep 2
done

# Check if we reached max attempts
if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
  echo "Error: PostgreSQL did not become ready in time. Proceeding anyway and hoping for the best..."
fi

# Create database if it doesn't exist
echo "Checking if database exists..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h db -U $POSTGRES_USER -lqt | grep -q "$POSTGRES_DB" || {
  echo "Database $POSTGRES_DB does not exist. Creating..."
  PGPASSWORD=$POSTGRES_PASSWORD psql -h db -U $POSTGRES_USER -c "CREATE DATABASE $POSTGRES_DB;"
  echo "Database $POSTGRES_DB created."
}

# Apply database migrations
echo "Running database migrations..."
alembic upgrade head

# Start the application
echo "Starting application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level info
