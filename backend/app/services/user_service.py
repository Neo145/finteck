from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User
from app.models.wallet import Wallet, WalletTransaction, TransactionType
from app.schemas.user import UpdateProfileRequest
from app.utils.redis_client import get_otp, delete_otp


async def get_profile_service(user: User) -> User:
    return user


async def update_profile_service(
    user: User,
    data: UpdateProfileRequest,
    db: AsyncSession
) -> User:
    if data.full_name is not None:
        user.full_name = data.full_name

    if data.email is not None:
        # Check email not already taken
        result = await db.execute(
            select(User).where(
                User.email == data.email,
                User.id != user.id
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise ValueError("Email already in use by another account")
        user.email = data.email

    await db.commit()
    await db.refresh(user)
    return user


async def change_phone_service(
    user: User,
    new_phone: str,
    otp: str,
    db: AsyncSession
) -> User:
    # Verify OTP for new phone
    stored_otp = await get_otp(new_phone)

    if not stored_otp:
        raise ValueError("OTP expired or not found. Request a new OTP.")

    if stored_otp != otp:
        raise ValueError("Invalid OTP. Please try again.")

    await delete_otp(new_phone)

    # Check new phone not already taken
    result = await db.execute(
        select(User).where(
            User.phone == new_phone,
            User.id != user.id
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise ValueError("Phone number already registered")

    user.phone = new_phone
    await db.commit()
    await db.refresh(user)
    return user


async def get_user_stats_service(
    user: User,
    db: AsyncSession
) -> dict:
    # Get wallet balance
    wallet_result = await db.execute(
        select(Wallet).where(Wallet.user_id == user.id)
    )
    wallet = wallet_result.scalar_one_or_none()
    balance = wallet.balance if wallet else 0

    # Total transactions
    count_result = await db.execute(
        select(func.count(WalletTransaction.id)).where(
            WalletTransaction.user_id == user.id
        )
    )
    total_transactions = count_result.scalar() or 0

    # Total credited
    credit_result = await db.execute(
        select(func.sum(WalletTransaction.net_amount)).where(
            WalletTransaction.user_id == user.id,
            WalletTransaction.transaction_type == TransactionType.credit
        )
    )
    total_credited = credit_result.scalar() or 0

    # Total debited
    debit_result = await db.execute(
        select(func.sum(WalletTransaction.net_amount)).where(
            WalletTransaction.user_id == user.id,
            WalletTransaction.transaction_type == TransactionType.debit
        )
    )
    total_debited = debit_result.scalar() or 0

    return {
        "total_transactions": total_transactions,
        "total_credited": str(total_credited),
        "total_debited": str(total_debited),
        "wallet_balance": str(balance),
        "member_since": user.created_at,
    }