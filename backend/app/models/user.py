from sqlalchemy import Column, String, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class UserRole(str, enum.Enum):
    user = "user"
    merchant = "merchant"
    admin = "admin"
    distributor = "distributor"


class KYCStatus(str, enum.Enum):
    pending = "pending"
    submitted = "submitted"
    approved = "approved"
    rejected = "rejected"


class User(BaseModel):
    __tablename__ = "users"

    full_name = Column(String(100), nullable=False)
    phone = Column(String(15), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    hashed_password = Column(String(255), nullable=True)
    role = Column(SAEnum(UserRole), default=UserRole.user, nullable=False)
    kyc_status = Column(SAEnum(KYCStatus), default=KYCStatus.pending, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Relationships
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    transactions = relationship("WalletTransaction", back_populates="user")