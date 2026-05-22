from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
from app.models.user import User
from app.models.wallet import Wallet, TransactionCategory
from app.models.withdrawal import Withdrawal, WithdrawalStatus, WithdrawalMethod
from app.services.wallet_service import get_wallet_service, debit_wallet_service
from app.schemas.withdrawal import WithdrawalRequest, AdminUpdateWithdrawalRequest
import uuid


async def create_withdrawal_service(
    user: User,
    data: WithdrawalRequest,
    db: AsyncSession
) -> Withdrawal:
    wallet = await get_wallet_service(user, db)

    if wallet.balance < data.amount:
        raise ValueError(f"Insufficient balance. Available: ₹{wallet.balance}")

    if data.method == "upi" and not data.upi_id:
        raise ValueError("UPI ID is required for UPI withdrawal")

    if data.method == "bank_transfer":
        if not data.bank_account_number:
            raise ValueError("Bank account number is required")
        if not data.bank_ifsc:
            raise ValueError("IFSC code is required")
        if not data.bank_account_name:
            raise ValueError("Account holder name is required")

    # Debit wallet immediately
    await debit_wallet_service(
        wallet=wallet,
        user=user,
        amount=data.amount,
        category=TransactionCategory.settlement,
        description=f"Withdrawal request via {data.method.upper()}",
        reference_id=f"WD-{uuid.uuid4().hex[:12].upper()}",
        db=db,
    )

    # Create withdrawal record
    withdrawal = Withdrawal(
        id=uuid.uuid4(),
        user_id=user.id,
        amount=data.amount,
        method=WithdrawalMethod(data.method),
        status=WithdrawalStatus.pending,
        upi_id=data.upi_id,
        bank_account_number=data.bank_account_number,
        bank_ifsc=data.bank_ifsc,
        bank_account_name=data.bank_account_name,
    )
    db.add(withdrawal)
    await db.commit()
    await db.refresh(withdrawal)
    return withdrawal


async def get_user_withdrawals_service(
    user: User,
    db: AsyncSession
) -> list:
    result = await db.execute(
        select(Withdrawal)
        .where(Withdrawal.user_id == user.id)
        .order_by(Withdrawal.created_at.desc())
    )
    return result.scalars().all()


async def get_all_withdrawals_service(
    db: AsyncSession,
    status: str = None
) -> list:
    query = select(Withdrawal).order_by(Withdrawal.created_at.desc())
    if status:
        query = query.where(Withdrawal.status == WithdrawalStatus(status))
    result = await db.execute(query)
    return result.scalars().all()


async def update_withdrawal_service(
    withdrawal_id: str,
    admin: User,
    data: AdminUpdateWithdrawalRequest,
    db: AsyncSession
) -> Withdrawal:
    result = await db.execute(
        select(Withdrawal).where(Withdrawal.id == withdrawal_id)
    )
    withdrawal = result.scalar_one_or_none()
    if not withdrawal:
        raise ValueError("Withdrawal request not found")

    if withdrawal.status == WithdrawalStatus.completed:
        raise ValueError("Withdrawal already completed")

    withdrawal.status = WithdrawalStatus(data.status)
    withdrawal.admin_note = data.admin_note
    withdrawal.transaction_ref = data.transaction_ref
    withdrawal.processed_by = admin.id

    # If rejected — refund wallet
    if data.status == "rejected":
        user_result = await db.execute(
            select(User).where(User.id == withdrawal.user_id)  # type: ignore
        )
        user = user_result.scalar_one_or_none()

        from app.models.wallet import Wallet
        wallet_result = await db.execute(
            select(Wallet).where(Wallet.user_id == withdrawal.user_id)
        )
        wallet = wallet_result.scalar_one_or_none()

        from app.services.wallet_service import credit_wallet_service
        await credit_wallet_service(
            wallet=wallet,
            user=user,
            amount=withdrawal.amount,
            category=TransactionCategory.refund,
            description=f"Withdrawal rejected - refund",
            reference_id=f"REFUND-{uuid.uuid4().hex[:12].upper()}",
            db=db,
        )

    await db.commit()
    await db.refresh(withdrawal)
    return withdrawal