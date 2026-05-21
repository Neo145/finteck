from sqlalchemy import Column, String, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class KYCDocumentType(str, enum.Enum):
    aadhaar = "aadhaar"
    pan = "pan"
    passport = "passport"
    driving_license = "driving_license"
    voter_id = "voter_id"


class KYCStatus(str, enum.Enum):
    pending = "pending"
    submitted = "submitted"
    approved = "approved"
    rejected = "rejected"


class KYC(BaseModel):
    __tablename__ = "kyc"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False, index=True)
    document_type = Column(SAEnum(KYCDocumentType), nullable=False)
    document_number = Column(String(50), nullable=False)
    document_front_url = Column(String(500), nullable=True)
    document_back_url = Column(String(500), nullable=True)
    selfie_url = Column(String(500), nullable=True)
    status = Column(SAEnum(KYCStatus), default=KYCStatus.submitted, nullable=False)
    rejection_reason = Column(Text, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])