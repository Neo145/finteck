from sqlalchemy import Column, String, Numeric, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class BillCategory(str, enum.Enum):
    electricity = "electricity"
    water = "water"
    gas = "gas"
    dth = "dth"
    broadband = "broadband"
    mobile_postpaid = "mobile_postpaid"
    insurance = "insurance"
    loan_emi = "loan_emi"


class BillPaymentStatus(str, enum.Enum):
    pending = "pending"
    success = "success"
    failed = "failed"


class BillPayment(BaseModel):
    __tablename__ = "bill_payments"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    category = Column(SAEnum(BillCategory), nullable=False)
    biller_name = Column(String(255), nullable=False)
    consumer_number = Column(String(100), nullable=False)
    amount = Column(Numeric(precision=18, scale=2), nullable=False)
    status = Column(SAEnum(BillPaymentStatus), default=BillPaymentStatus.pending, nullable=False)
    reference_id = Column(String(255), nullable=True, index=True)
    operator_ref = Column(String(255), nullable=True)
    remarks = Column(Text, nullable=True)

    user = relationship("User")