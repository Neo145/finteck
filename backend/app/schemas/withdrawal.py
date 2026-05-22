from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime


class WithdrawalRequest(BaseModel):
    amount: Decimal
    method: str
    upi_id: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_account_name: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v < 10:
            raise ValueError("Minimum withdrawal amount is Rs.10")
        if v > 50000:
            raise ValueError("Maximum withdrawal amount is Rs.50000")
        return v

    @field_validator("method")
    @classmethod
    def validate_method(cls, v: str) -> str:
        if v not in ["upi", "bank_transfer"]:
            raise ValueError("Method must be upi or bank_transfer")
        return v


class WithdrawalResponse(BaseModel):
    id: UUID
    user_id: UUID
    amount: Decimal
    method: str
    status: str
    upi_id: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_account_name: Optional[str] = None
    admin_note: Optional[str] = None
    transaction_ref: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdminUpdateWithdrawalRequest(BaseModel):
    status: str
    admin_note: Optional[str] = None
    transaction_ref: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = ["processing", "completed", "rejected"]
        if v not in allowed:
            raise ValueError(f"Status must be one of {allowed}")
        return v