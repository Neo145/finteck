import httpx
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
from app.core.config import settings
from app.models.user import User
from app.models.wallet import Wallet, TransactionCategory
from app.models.payment import Payment, PaymentStatus, PaymentGateway
from app.services.wallet_service import get_wallet_service, credit_wallet_service

CASHFREE_BASE_URL = "https://api.cashfree.com/pg"
CASHFREE_API_VERSION = "2023-08-01"


def get_cashfree_headers():
    return {
        "x-api-version": CASHFREE_API_VERSION,
        "x-client-id": settings.CASHFREE_APP_ID,
        "x-client-secret": settings.CASHFREE_SECRET_KEY,
        "Content-Type": "application/json",
    }


async def create_cashfree_order_service(
    user: User,
    amount: Decimal,
    db: AsyncSession
) -> dict:
    wallet = await get_wallet_service(user, db)
    order_id = f"CF{uuid.uuid4().hex[:12].upper()}"

    payload = {
        "order_id": order_id,
        "order_amount": float(amount),
        "order_currency": "INR",
        "customer_details": {
            "customer_id": str(user.id)[:50],
            "customer_name": user.full_name,
            "customer_email": user.email or f"user{user.phone}@fintechpay.in",
            "customer_phone": user.phone,
        },
        "order_meta": {
            "return_url": f"https://finteck-wine.vercel.app/dashboard?order_id={order_id}",
        },
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{CASHFREE_BASE_URL}/orders",
            headers=get_cashfree_headers(),
            json=payload,
            timeout=30.0
        )
        data = response.json()

    if response.status_code != 200:
        raise ValueError(f"Cashfree error: {data.get('message', 'Unknown error')}")

    payment = Payment(
        id=uuid.uuid4(),
        user_id=user.id,
        wallet_id=wallet.id,
        gateway=PaymentGateway.cashfree,
        gateway_order_id=order_id,
        amount=amount,
        currency="INR",
        status=PaymentStatus.created,
        description=f"Wallet topup Rs.{amount}",
    )
    db.add(payment)
    await db.commit()

    return {
        "order_id": order_id,
        "payment_session_id": data.get("payment_session_id"),
        "amount": float(amount),
        "currency": "INR",
        "app_id": settings.CASHFREE_APP_ID,
        "user_name": user.full_name,
        "user_phone": user.phone,
        "user_email": user.email or "",
    }


async def verify_cashfree_payment_service(
    order_id: str,
    db: AsyncSession
) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{CASHFREE_BASE_URL}/orders/{order_id}",
            headers=get_cashfree_headers(),
            timeout=30.0
        )
        data = response.json()

    order_status = data.get("order_status")
    if order_status != "PAID":
        raise ValueError(f"Payment not completed. Status: {order_status}")

    result = await db.execute(
        select(Payment).where(Payment.gateway_order_id == order_id)
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise ValueError("Payment record not found")

    if payment.status == PaymentStatus.success:
        return {"message": "Payment already processed"}

    payment.status = PaymentStatus.success
    await db.flush()

    wallet_result = await db.execute(
        select(Wallet).where(Wallet.id == payment.wallet_id)
    )
    wallet = wallet_result.scalar_one_or_none()

    user_result = await db.execute(
        select(User).where(User.id == payment.user_id)
    )
    user = user_result.scalar_one_or_none()

    await credit_wallet_service(
        wallet=wallet,
        user=user,
        amount=payment.amount,
        category=TransactionCategory.wallet_topup,
        description="Wallet topup via Cashfree",
        reference_id=order_id,
        db=db,
    )

    return {"message": "Payment verified and wallet credited"}