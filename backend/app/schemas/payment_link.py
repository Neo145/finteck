from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime


class CreatePaymentLinkRequest(BaseModel):
    title: str
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    is_fixed_amount: bool = True

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Title must be at least 3 characters")
        if len(v) > 255:
            raise ValueError("Title must be under 255 characters")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v <= 0:
            raise ValueError("Amount must be greater than 0")
        return v


class PaymentLinkResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    is_fixed_amount: bool
    link_code: str
    status: str
    total_collected: Decimal
    payment_url: str
    created_at: datetime

    class Config:
        from_attributes = True


class PayLinkRequest(BaseModel):
    amount: Optional[Decimal] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v <= 0:
            raise ValueError("Amount must be greater than 0")
        return v