"""Create simplified tasks table

Revision ID: create_simplified_tasks_table
Revises: aaf2ade1b6fd
Create Date: 2025-01-24 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'create_simplified_tasks_table'
down_revision: Union[str, None] = 'aaf2ade1b6fd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create everything with raw SQL to avoid SQLAlchemy enum issues
    op.execute("""
        DO $$
        BEGIN
            -- Create enum if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'taskstatus') THEN
                CREATE TYPE taskstatus AS ENUM ('pending', 'running', 'completed', 'failed');
            END IF;
            
            -- Create tasks table
            CREATE TABLE tasks (
                id VARCHAR(36) NOT NULL,
                user_id INTEGER NOT NULL,
                status taskstatus NOT NULL,
                result_data TEXT,
                error_message TEXT,
                created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
                CONSTRAINT tasks_pkey PRIMARY KEY (id),
                CONSTRAINT tasks_user_id_fkey FOREIGN KEY(user_id) REFERENCES users (id)
            );
            
            -- Create index
            CREATE INDEX ix_tasks_id ON tasks (id);
        END$$;
    """)


def downgrade() -> None:
    # Drop tasks table and enum with raw SQL
    op.execute("""
        DROP INDEX IF EXISTS ix_tasks_id;
        DROP TABLE IF EXISTS tasks;
        DROP TYPE IF EXISTS taskstatus;
    """)
