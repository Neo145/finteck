from pydantic import BaseModel, field_validator
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import datetime


class BillerResponse(BaseModel):
    id: str
    name: str
    logo: str


class FetchBillRequest(BaseModel):
    biller_id: str
    consumer_number: str
    category: str

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        allowed = ["electricity", "water", "gas", "dth", "broadband", "mobile_postpaid", "insurance", "loan_emi"]
        if v not in allowed:
            raise ValueError(f"Invalid category")
        return v


class BillDetailsResponse(BaseModel):
    consumer_number: str
    biller_id: str
    biller_name: str
    amount: float
    due_date: str
    bill_date: str
    consumer_name: str
    status: str


class PayBillRequest(BaseModel):
    biller_id: str
    biller_name: str
    consumer_number: str
    amount: Decimal
    category: str

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be greater than 0")
        return v


class BillPaymentResponse(BaseModel):
    id: UUID
    user_id: UUID
    category: str
    biller_name: str
    consumer_number: str
    amount: Decimal
    status: str
    reference_id: Optional[str] = None
    operator_ref: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True