from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class AdminUserResponse(BaseModel):
    id: UUID
    full_name: str
    phone: str
    email: Optional[str] = None
    role: str
    kyc_status: str
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminUpdateUserRequest(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None
    kyc_status: Optional[str] = None


class AdminTransactionResponse(BaseModel):
    id: UUID
    user_id: UUID
    transaction_type: str
    transaction_status: str
    category: str
    amount: Decimal
    commission: Decimal
    net_amount: Decimal
    reference_id: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AdminDashboardStats(BaseModel):
    total_users: int
    total_transactions: int
    total_volume: str
    total_wallet_balance: str
    pending_kyc: int
    today_transactions: int
    today_volume: str


class AdminTransactionListResponse(BaseModel):
    transactions: List[AdminTransactionResponse]
    total: int
    page: int
    page_size: int