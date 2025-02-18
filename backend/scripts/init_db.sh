#!/bin/bash

# Create database
psql -U postgres -c "CREATE DATABASE litxplore_db;"

# Initialize Alembic
cd ..
alembic init alembic

# Generate initial migration
alembic revision --autogenerate -m "Initial migration"

# Run migrations
alembic upgrade head

echo "Database initialization completed successfully!" 