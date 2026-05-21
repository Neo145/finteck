from sqlalchemy import Column, String, Numeric, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class PaymentStatus(str, enum.Enum):
    created = "created"
    pending = "pending"
    success = "success"
    failed = "failed"
    refunded = "refunded"


class PaymentGateway(str, enum.Enum):
    razorpay = "razorpay"
    cashfree = "cashfree"
    payu = "payu"


class Payment(BaseModel):
    __tablename__ = "payments"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False)
    gateway = Column(SAEnum(PaymentGateway), nullable=False, default=PaymentGateway.razorpay)
    gateway_order_id = Column(String(255), unique=True, nullable=False, index=True)
    gateway_payment_id = Column(String(255), nullable=True, index=True)
    gateway_signature = Column(String(500), nullable=True)
    amount = Column(Numeric(precision=18, scale=2), nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    status = Column(SAEnum(PaymentStatus), default=PaymentStatus.created, nullable=False)
    description = Column(String(500), nullable=True)

    # Relationships
    user = relationship("User")
    wallet = relationship("Wallet")