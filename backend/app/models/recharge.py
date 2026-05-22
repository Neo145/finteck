from sqlalchemy import Column, String, Numeric, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class RechargeType(str, enum.Enum):
    prepaid = "prepaid"
    dth = "dth"
    data_card = "data_card"


class RechargeStatus(str, enum.Enum):
    pending = "pending"
    success = "success"
    failed = "failed"
    refunded = "refunded"


class RechargeOperator(str, enum.Enum):
    airtel = "airtel"
    jio = "jio"
    vi = "vi"
    bsnl = "bsnl"
    tataplay = "tataplay"
    dishtv = "dishtv"


class Recharge(BaseModel):
    __tablename__ = "recharges"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    mobile_number = Column(String(15), nullable=False)
    operator = Column(SAEnum(RechargeOperator), nullable=False)
    recharge_type = Column(SAEnum(RechargeType), nullable=False)
    amount = Column(Numeric(precision=18, scale=2), nullable=False)
    plan_description = Column(String(500), nullable=True)
    status = Column(SAEnum(RechargeStatus), default=RechargeStatus.pending, nullable=False)
    reference_id = Column(String(255), nullable=True, index=True)
    operator_ref = Column(String(255), nullable=True)

    user = relationship("User")