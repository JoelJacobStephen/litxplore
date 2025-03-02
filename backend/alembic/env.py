import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# Append the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import Base and models
from app.db.base_class import Base
from app.models.user import User
from app.models.review import Review
from app.core.config import settings

# this is the Alembic Config object
config = context.config

# Determine the host to use - Docker environment will use 'db' (service name),
# while local development will use the value from settings
postgres_host = "db" if os.environ.get("DOCKER_ENV") == "true" else settings.POSTGRES_HOST

# Modify the database URL configuration with error handling
try:
    database_url = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{postgres_host}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    config.set_main_option("sqlalchemy.url", database_url)
except Exception as e:
    print(f"Error configuring database URL: {e}")
    raise

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()