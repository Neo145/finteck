from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date
from datetime import datetime, timezone
from decimal import Decimal
from app.models.user import User, UserRole, KYCStatus
from app.models.wallet import Wallet, WalletTransaction, TransactionType
from app.models.kyc import KYC, KYCStatus as KYCRecordStatus
from app.schemas.admin import AdminUpdateUserRequest


async def get_all_users_service(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: str = None
) -> dict:
    offset = (page - 1) * page_size
    query = select(User)
    count_query = select(func.count(User.id))

    if search:
        query = query.where(
            User.phone.ilike(f"%{search}%") |
            User.full_name.ilike(f"%{search}%")
        )
        count_query = count_query.where(
            User.phone.ilike(f"%{search}%") |
            User.full_name.ilike(f"%{search}%")
        )

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    result = await db.execute(
        query.order_by(User.created_at.desc())
        .limit(page_size)
        .offset(offset)
    )
    users = result.scalars().all()

    return {"users": users, "total": total, "page": page, "page_size": page_size}


async def update_user_service(
    user_id: str,
    data: AdminUpdateUserRequest,
    db: AsyncSession
) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("User not found")

    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role is not None:
        user.role = UserRole(data.role)
    if data.kyc_status is not None:
        user.kyc_status = KYCStatus(data.kyc_status)

    await db.commit()
    await db.refresh(user)
    return user


async def get_all_transactions_service(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    transaction_type: str = None,
    status: str = None
) -> dict:
    offset = (page - 1) * page_size
    query = select(WalletTransaction)
    count_query = select(func.count(WalletTransaction.id))

    if transaction_type:
        query = query.where(WalletTransaction.transaction_type == transaction_type)
        count_query = count_query.where(WalletTransaction.transaction_type == transaction_type)
    if status:
        query = query.where(WalletTransaction.transaction_status == status)
        count_query = count_query.where(WalletTransaction.transaction_status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    result = await db.execute(
        query.order_by(WalletTransaction.created_at.desc())
        .limit(page_size)
        .offset(offset)
    )
    transactions = result.scalars().all()

    return {
        "transactions": transactions,
        "total": total,
        "page": page,
        "page_size": page_size
    }


async def get_dashboard_stats_service(db: AsyncSession) -> dict:
    # Total users
    total_users = (await db.execute(select(func.count(User.id)))).scalar()

    # Total transactions
    total_tx = (await db.execute(select(func.count(WalletTransaction.id)))).scalar()

    # Total volume
    total_volume = (await db.execute(
        select(func.sum(WalletTransaction.amount)).where(
            WalletTransaction.transaction_type == TransactionType.credit
        )
    )).scalar() or Decimal("0")

    # Total wallet balance
    total_balance = (await db.execute(
        select(func.sum(Wallet.balance))
    )).scalar() or Decimal("0")

    # Pending KYC
    pending_kyc = (await db.execute(
        select(func.count(KYC.id)).where(
            KYC.status == KYCRecordStatus.submitted
        )
    )).scalar()

    # Today transactions
    today = datetime.now(timezone.utc).date()
    today_tx = (await db.execute(
        select(func.count(WalletTransaction.id)).where(
            cast(WalletTransaction.created_at, Date) == today
        )
    )).scalar()

    # Today volume
    today_volume = (await db.execute(
        select(func.sum(WalletTransaction.amount)).where(
            cast(WalletTransaction.created_at, Date) == today,
            WalletTransaction.transaction_type == TransactionType.credit
        )
    )).scalar() or Decimal("0")

    return {
        "total_users": total_users,
        "total_transactions": total_tx,
        "total_volume": str(total_volume),
        "total_wallet_balance": str(total_balance),
        "pending_kyc": pending_kyc,
        "today_transactions": today_tx,
        "today_volume": str(today_volume),
    }