from sqlalchemy import Column, String, Numeric, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class WithdrawalStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    rejected = "rejected"


class WithdrawalMethod(str, enum.Enum):
    upi = "upi"
    bank_transfer = "bank_transfer"


class Withdrawal(BaseModel):
    __tablename__ = "withdrawals"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(precision=18, scale=2), nullable=False)
    method = Column(SAEnum(WithdrawalMethod), nullable=False)
    status = Column(SAEnum(WithdrawalStatus), default=WithdrawalStatus.pending, nullable=False)

    upi_id = Column(String(100), nullable=True)
    bank_account_number = Column(String(50), nullable=True)
    bank_ifsc = Column(String(20), nullable=True)
    bank_account_name = Column(String(100), nullable=True)

    admin_note = Column(Text, nullable=True)
    processed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    transaction_ref = Column(String(255), nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    processor = relationship("User", foreign_keys=[processed_by])