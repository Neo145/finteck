from pydantic import BaseModel, field_validator
from decimal import Decimal
from typing import List
from datetime import datetime
from uuid import UUID


class WalletResponse(BaseModel):
    id: UUID
    balance: Decimal
    currency: str
    is_active: bool

    class Config:
        from_attributes = True


class AddMoneyRequest(BaseModel):
    amount: Decimal
    gateway: str

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be greater than 0")
        if v > 100000:
            raise ValueError("Maximum top-up amount is 1,00,000")
        return v


class AddMoneyResponse(BaseModel):
    order_id: str
    amount: Decimal
    currency: str
    gateway: str
    payment_url: str | None = None


class TransactionResponse(BaseModel):
    id: UUID
    transaction_type: str
    transaction_status: str
    category: str
    amount: Decimal
    commission: Decimal
    net_amount: Decimal
    reference_id: str | None
    description: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    transactions: List[TransactionResponse]
    total: int
    page: int
    page_size: int


class WalletWithTransactionsResponse(BaseModel):
    wallet: WalletResponse
    recent_transactions: List[TransactionResponse]

    class Config:
        from_attributes = True