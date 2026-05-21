"""add kyc table

Revision ID: be9fae90815f
Revises: 4eaf65bac543
Create Date: 2026-05-21 15:02:24.208469
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'be9fae90815f'
down_revision: Union[str, Sequence[str], None] = '4eaf65bac543'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('kyc',
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('document_type', sa.Enum('aadhaar', 'pan', 'passport', 'driving_license', 'voter_id', name='kycdocumenttype', create_type=True), nullable=False),
    sa.Column('document_number', sa.String(length=50), nullable=False),
    sa.Column('document_front_url', sa.String(length=500), nullable=True),
    sa.Column('document_back_url', sa.String(length=500), nullable=True),
    sa.Column('selfie_url', sa.String(length=500), nullable=True),
    sa.Column('status', sa.Enum('pending', 'submitted', 'approved', 'rejected', name='kycstatus', create_type=False), nullable=False),
    sa.Column('rejection_reason', sa.Text(), nullable=True),
    sa.Column('reviewed_by', sa.UUID(), nullable=True),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_kyc_id'), 'kyc', ['id'], unique=False)
    op.create_index(op.f('ix_kyc_user_id'), 'kyc', ['user_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_kyc_user_id'), table_name='kyc')
    op.drop_index(op.f('ix_kyc_id'), table_name='kyc')
    op.drop_table('kyc')