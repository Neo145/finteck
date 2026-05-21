from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from decimal import Decimal
from app.models.user import User
from app.models.wallet import Wallet, WalletTransaction, WalletLedger
from app.models.wallet import TransactionType, TransactionStatus, TransactionCategory
from app.schemas.wallet import AddMoneyRequest
import uuid


async def get_wallet_service(user: User, db: AsyncSession) -> Wallet:
    result = await db.execute(
        select(Wallet).where(Wallet.user_id == user.id)
    )
    wallet = result.scalar_one_or_none()
    if not wallet:
        raise ValueError("Wallet not found")
    return wallet


async def get_transactions_service(
    user: User,
    db: AsyncSession,
    page: int = 1,
    page_size: int = 10
) -> dict:
    offset = (page - 1) * page_size

    count_result = await db.execute(
        select(func.count(WalletTransaction.id)).where(
            WalletTransaction.user_id == user.id
        )
    )
    total = count_result.scalar()

    result = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.user_id == user.id)
        .order_by(WalletTransaction.created_at.desc())
        .limit(page_size)
        .offset(offset)
    )
    transactions = result.scalars().all()

    return {
        "transactions": transactions,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


async def credit_wallet_service(
    wallet: Wallet,
    user: User,
    amount: Decimal,
    category: TransactionCategory,
    description: str,
    reference_id: str,
    db: AsyncSession,
    commission: Decimal = Decimal("0.00"),
) -> WalletTransaction:
    # Calculate net amount
    net_amount = amount - commission
    balance_before = wallet.balance
    balance_after = balance_before + net_amount

    # Create transaction
    transaction = WalletTransaction(
        id=uuid.uuid4(),
        user_id=user.id,
        wallet_id=wallet.id,
        transaction_type=TransactionType.credit,
        transaction_status=TransactionStatus.success,
        category=category,
        amount=amount,
        commission=commission,
        net_amount=net_amount,
        reference_id=reference_id,
        description=description,
    )
    db.add(transaction)
    await db.flush()

    # Create ledger entry
    ledger = WalletLedger(
        id=uuid.uuid4(),
        wallet_id=wallet.id,
        transaction_id=transaction.id,
        entry_type=TransactionType.credit,
        amount=net_amount,
        balance_before=balance_before,
        balance_after=balance_after,
        description=description,
    )
    db.add(ledger)

    # Update wallet balance
    wallet.balance = balance_after
    await db.commit()
    await db.refresh(transaction)

    return transaction


async def debit_wallet_service(
    wallet: Wallet,
    user: User,
    amount: Decimal,
    category: TransactionCategory,
    description: str,
    reference_id: str,
    db: AsyncSession,
    commission: Decimal = Decimal("0.00"),
) -> WalletTransaction:
    # Check sufficient balance
    if wallet.balance < amount:
        raise ValueError("Insufficient wallet balance")

    net_amount = amount + commission
    balance_before = wallet.balance
    balance_after = balance_before - net_amount

    # Create transaction
    transaction = WalletTransaction(
        id=uuid.uuid4(),
        user_id=user.id,
        wallet_id=wallet.id,
        transaction_type=TransactionType.debit,
        transaction_status=TransactionStatus.success,
        category=category,
        amount=amount,
        commission=commission,
        net_amount=net_amount,
        reference_id=reference_id,
        description=description,
    )
    db.add(transaction)
    await db.flush()

    # Create ledger entry
    ledger = WalletLedger(
        id=uuid.uuid4(),
        wallet_id=wallet.id,
        transaction_id=transaction.id,
        entry_type=TransactionType.debit,
        amount=net_amount,
        balance_before=balance_before,
        balance_after=balance_after,
        description=description,
    )
    db.add(ledger)

    # Update wallet balance
    wallet.balance = balance_after
    await db.commit()
    await db.refresh(transaction)

    return transaction