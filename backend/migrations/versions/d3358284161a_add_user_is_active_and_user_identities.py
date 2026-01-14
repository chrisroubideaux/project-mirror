"""add user is_active and user_identities

Revision ID: d3358284161a
Revises: b0392bb7366c
Create Date: 2026-01-13 20:25:03.259873
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column


# revision identifiers, used by Alembic.
revision = 'd3358284161a'
down_revision = 'b0392bb7366c'
branch_labels = None
depends_on = None


def upgrade():
    # --------------------------------------------------
    # 1️⃣ Create user_identities table
    # --------------------------------------------------
    op.create_table(
        'user_identities',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('provider_user_id', sa.String(length=255), nullable=False),
        sa.Column('email_at_auth_time', sa.String(length=120), nullable=True),
        sa.Column('email_verified', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('provider', 'provider_user_id', name='uq_user_provider_identity'),
    )

    op.create_index(
        'ix_user_identities_user_id',
        'user_identities',
        ['user_id'],
        unique=False
    )

    op.create_index(
        'ix_user_identities_provider_user_id',
        'user_identities',
        ['provider_user_id'],
        unique=False
    )

    # --------------------------------------------------
    # 2️⃣ Add users.is_active safely
    # --------------------------------------------------

    # Add column as nullable first
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('is_active', sa.Boolean(), nullable=True)
        )

    # Backfill existing users
    users = table(
        'users',
        column('is_active', sa.Boolean())
    )

    op.execute(
        users.update().values(is_active=True)
    )

    # Enforce NOT NULL
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column(
            'is_active',
            existing_type=sa.Boolean(),
            nullable=False
        )


def downgrade():
    # --------------------------------------------------
    # Rollback users.is_active
    # --------------------------------------------------
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('is_active')

    # --------------------------------------------------
    # Drop user_identities
    # --------------------------------------------------
    op.drop_index('ix_user_identities_provider_user_id', table_name='user_identities')
    op.drop_index('ix_user_identities_user_id', table_name='user_identities')
    op.drop_table('user_identities')
