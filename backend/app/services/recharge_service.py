import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
from app.models.user import User
from app.models.wallet import TransactionCategory
from app.models.recharge import Recharge, RechargeType, RechargeStatus, RechargeOperator
from app.services.wallet_service import get_wallet_service, debit_wallet_service

MOCK_PLANS = {
    "airtel": {
        "prepaid": [
            {"id": "A1", "amount": 19, "validity": "1 Day", "description": "1GB Data + Unlimited Calls"},
            {"id": "A2", "amount": 99, "validity": "14 Days", "description": "1GB/Day + Unlimited Calls + 100 SMS/Day"},
            {"id": "A3", "amount": 199, "validity": "28 Days", "description": "1.5GB/Day + Unlimited Calls + 100 SMS/Day"},
            {"id": "A4", "amount": 299, "validity": "28 Days", "description": "2GB/Day + Unlimited Calls + 100 SMS/Day"},
            {"id": "A5", "amount": 399, "validity": "56 Days", "description": "2.5GB/Day + Unlimited Calls"},
            {"id": "A6", "amount": 599, "validity": "84 Days", "description": "2GB/Day + Unlimited Calls + Disney+Hotstar"},
        ]
    },
    "jio": {
        "prepaid": [
            {"id": "J1", "amount": 19, "validity": "1 Day", "description": "1GB Data + Free Calls"},
            {"id": "J2", "amount": 99, "validity": "14 Days", "description": "1.5GB/Day + Unlimited Calls"},
            {"id": "J3", "amount": 199, "validity": "28 Days", "description": "2GB/Day + Unlimited Calls"},
            {"id": "J4", "amount": 299, "validity": "28 Days", "description": "3GB/Day + Unlimited Calls + JioApps"},
            {"id": "J5", "amount": 399, "validity": "56 Days", "description": "2GB/Day + Unlimited Calls"},
            {"id": "J6", "amount": 666, "validity": "84 Days", "description": "2GB/Day + Unlimited Calls + JioCinema"},
        ]
    },
    "vi": {
        "prepaid": [
            {"id": "V1", "amount": 19, "validity": "1 Day", "description": "1GB Data + Calls"},
            {"id": "V2", "amount": 99, "validity": "14 Days", "description": "1GB/Day + Unlimited Calls"},
            {"id": "V3", "amount": 199, "validity": "28 Days", "description": "1.5GB/Day + Unlimited Calls"},
            {"id": "V4", "amount": 299, "validity": "28 Days", "description": "2GB/Day + Unlimited Calls"},
            {"id": "V5", "amount": 399, "validity": "56 Days", "description": "2GB/Day + Unlimited Calls + Vi Movies"},
        ]
    },
    "bsnl": {
        "prepaid": [
            {"id": "B1", "amount": 22, "validity": "1 Day", "description": "1GB Data"},
            {"id": "B2", "amount": 107, "validity": "15 Days", "description": "1GB/Day + Calls"},
            {"id": "B3", "amount": 187, "validity": "28 Days", "description": "1GB/Day + Unlimited Calls"},
            {"id": "B4", "amount": 247, "validity": "28 Days", "description": "2GB/Day + Unlimited Calls"},
        ]
    },
}

OPERATORS = [
    {"id": "airtel", "name": "Airtel", "logo": "🔴", "color": "rgba(239,68,68,0.1)"},
    {"id": "jio", "name": "Jio", "logo": "🔵", "color": "rgba(59,130,246,0.1)"},
    {"id": "vi", "name": "Vi", "logo": "🟣", "color": "rgba(139,92,246,0.1)"},
    {"id": "bsnl", "name": "BSNL", "logo": "🟢", "color": "rgba(16,185,129,0.1)"},
]


def get_operators_service() -> list:
    return OPERATORS


def get_plans_service(operator: str, recharge_type: str) -> list:
    return MOCK_PLANS.get(operator, {}).get(recharge_type, [])


async def do_recharge_service(
    user: User,
    mobile_number: str,
    operator: str,
    recharge_type: str,
    amount: Decimal,
    plan_description: str,
    db: AsyncSession
) -> Recharge:
    wallet = await get_wallet_service(user, db)

    if wallet.balance < amount:
        raise ValueError(f"Insufficient balance. Available: ₹{wallet.balance}")

    reference_id = f"RCH-{uuid.uuid4().hex[:12].upper()}"

    await debit_wallet_service(
        wallet=wallet,
        user=user,
        amount=amount,
        category=TransactionCategory.payment,
        description=f"Recharge {mobile_number} - {operator.upper()} ₹{amount}",
        reference_id=reference_id,
        db=db,
    )

    recharge = Recharge(
        id=uuid.uuid4(),
        user_id=user.id,
        mobile_number=mobile_number,
        operator=RechargeOperator(operator),
        recharge_type=RechargeType(recharge_type),
        amount=amount,
        plan_description=plan_description,
        status=RechargeStatus.success,
        reference_id=reference_id,
        operator_ref=f"OP{uuid.uuid4().hex[:8].upper()}",
    )
    db.add(recharge)
    await db.commit()
    await db.refresh(recharge)
    return recharge


async def get_recharge_history_service(
    user: User,
    db: AsyncSession
) -> list:
    result = await db.execute(
        select(Recharge)
        .where(Recharge.user_id == user.id)
        .order_by(Recharge.created_at.desc())
    )
    return result.scalars().all()