from sqlalchemy import Column, String, Numeric, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class TransactionType(str, enum.Enum):
    credit = "credit"
    debit = "debit"


class TransactionStatus(str, enum.Enum):
    pending = "pending"
    success = "success"
    failed = "failed"
    reversed = "reversed"


class TransactionCategory(str, enum.Enum):
    wallet_topup = "wallet_topup"
    payment = "payment"
    refund = "refund"
    commission = "commission"
    settlement = "settlement"
    booking = "booking"


class Wallet(BaseModel):
    __tablename__ = "wallets"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    balance = Column(Numeric(precision=18, scale=2), default=0.00, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    currency = Column(String(3), default="INR", nullable=False)

    # Relationships
    user = relationship("User", back_populates="wallet")
    transactions = relationship("WalletTransaction", back_populates="wallet")
    ledger_entries = relationship("WalletLedger", back_populates="wallet")


class WalletTransaction(BaseModel):
    __tablename__ = "wallet_transactions"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False)
    transaction_type = Column(SAEnum(TransactionType), nullable=False)
    transaction_status = Column(SAEnum(TransactionStatus), default=TransactionStatus.pending, nullable=False)
    category = Column(SAEnum(TransactionCategory), nullable=False)
    amount = Column(Numeric(precision=18, scale=2), nullable=False)
    commission = Column(Numeric(precision=18, scale=2), default=0.00)
    net_amount = Column(Numeric(precision=18, scale=2), nullable=False)
    reference_id = Column(String(255), unique=True, nullable=True, index=True)
    gateway_reference = Column(String(255), nullable=True)
    description = Column(String(500), nullable=True)
    meta_data = Column(String(1000), nullable=True)

    # Relationships
    user = relationship("User", back_populates="transactions")
    wallet = relationship("Wallet", back_populates="transactions")
    ledger_entries = relationship("WalletLedger", back_populates="transaction")


class WalletLedger(BaseModel):
    __tablename__ = "wallet_ledger"

    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("wallet_transactions.id"), nullable=False)
    entry_type = Column(SAEnum(TransactionType), nullable=False)
    amount = Column(Numeric(precision=18, scale=2), nullable=False)
    balance_before = Column(Numeric(precision=18, scale=2), nullable=False)
    balance_after = Column(Numeric(precision=18, scale=2), nullable=False)
    description = Column(String(500), nullable=True)

    # Relationships
    wallet = relationship("Wallet", back_populates="ledger_entries")
    transaction = relationship("WalletTransaction", back_populates="ledger_entries")