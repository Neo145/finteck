from sqlalchemy import Column, String, Numeric, Boolean, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class PaymentLinkStatus(str, enum.Enum):
    active = "active"
    paid = "paid"
    expired = "expired"
    cancelled = "cancelled"


class PaymentLink(BaseModel):
    __tablename__ = "payment_links"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    amount = Column(Numeric(precision=18, scale=2), nullable=True)
    is_fixed_amount = Column(Boolean, default=True, nullable=False)
    link_code = Column(String(50), unique=True, nullable=False, index=True)
    status = Column(SAEnum(PaymentLinkStatus), default=PaymentLinkStatus.active, nullable=False)
    max_payments = Column(String(10), nullable=True)
    total_collected = Column(Numeric(precision=18, scale=2), default=0.00)

    # Relationships
    user = relationship("User")