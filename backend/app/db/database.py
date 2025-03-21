from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import settings
import os
import logging
from sqlalchemy.engine import Engine

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Determine the host to use - Docker environment will use 'db' (service name),
# while local development will use the value from settings
postgres_host = "db" if os.environ.get("DOCKER_ENV") == "true" else settings.POSTGRES_HOST

# Log the database connection parameters (omitting sensitive info)
connection_info = f"postgresql://{settings.POSTGRES_USER}:***@{postgres_host}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
logger.info(f"Connecting to database at: {connection_info}")

# Create the connection URL
SQLALCHEMY_DATABASE_URL = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{postgres_host}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"

# Configure engine with a larger pool_size and longer timeout for Docker environment
engine_args = {
    "pool_pre_ping": True,  # Verify connections before using them
    "pool_size": 10,       # Larger connection pool
    "max_overflow": 20,
    "pool_recycle": 3600,  # Recycle connections after an hour
    "pool_timeout": 30,    # Wait longer for connections
    "connect_args": {"connect_timeout": 10}  # PostgreSQL connection timeout
}

try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_args)
    # Test the connection
    with engine.connect() as connection:
        logger.info("Database connection successfully established")
except Exception as e:
    logger.error(f"Failed to connect to database: {str(e)}")
    # Re-raise the exception after logging
    raise

# Set up session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Define Base class for models
Base = declarative_base()

# Dependency to get DB session with better error handling
def get_db():
    db = SessionLocal()
    try:
        # Test the connection by executing a simple query
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        yield db
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        # Close the session if there's an error
        db.close()
        # Re-raise the exception to be handled by the endpoint
        raise
    finally:
        db.close()