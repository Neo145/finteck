from pydantic import BaseModel, field_validator
from decimal import Decimal
from uuid import UUID
from datetime import datetime


class CreatePaymentOrderRequest(BaseModel):
    amount: Decimal

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be greater than 0")
        if v > 100000:
            raise ValueError("Maximum amount is 1,00,000")
        return v


class CreatePaymentOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str
    user_name: str
    user_phone: str
    user_email: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentResponse(BaseModel):
    id: UUID
    gateway: str
    gateway_order_id: str
    gateway_payment_id: str | None
    amount: Decimal
    currency: str
    status: str
    description: str | None
    created_at: datetime

    class Config:
        from_attributes = True