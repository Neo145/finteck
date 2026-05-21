from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime


class KYCSubmitRequest(BaseModel):
    document_type: str
    document_number: str

    @field_validator("document_type")
    @classmethod
    def validate_document_type(cls, v: str) -> str:
        allowed = ["aadhaar", "pan", "passport", "driving_license", "voter_id"]
        if v not in allowed:
            raise ValueError(f"Document type must be one of {allowed}")
        return v

    @field_validator("document_number")
    @classmethod
    def validate_document_number(cls, v: str) -> str:
        v = v.strip().upper()
        if len(v) < 5:
            raise ValueError("Invalid document number")
        return v


class KYCResponse(BaseModel):
    id: UUID
    user_id: UUID
    document_type: str
    document_number: str
    document_front_url: Optional[str] = None
    document_back_url: Optional[str] = None
    selfie_url: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class KYCReviewRequest(BaseModel):
    status: str
    rejection_reason: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = ["approved", "rejected"]
        if v not in allowed:
            raise ValueError("Status must be approved or rejected")
        return v