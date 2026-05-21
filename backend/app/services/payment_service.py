import razorpay
import hmac
import hashlib
import json
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
from app.core.config import settings
from app.models.user import User
from app.models.wallet import Wallet, TransactionCategory
from app.models.payment import Payment, PaymentStatus, PaymentGateway
from app.services.wallet_service import get_wallet_service, credit_wallet_service

razorpay_client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
)


async def create_payment_order_service(
    user: User,
    amount: Decimal,
    db: AsyncSession
) -> dict:
    wallet = await get_wallet_service(user, db)
    amount_paise = int(amount * 100)
    razorpay_order = razorpay_client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"rcpt_{uuid.uuid4().hex[:12]}",
        "notes": {
            "user_id": str(user.id),
            "wallet_id": str(wallet.id),
        }
    })
    payment = Payment(
        id=uuid.uuid4(),
        user_id=user.id,
        wallet_id=wallet.id,
        gateway=PaymentGateway.razorpay,
        gateway_order_id=razorpay_order["id"],
        amount=amount,
        currency="INR",
        status=PaymentStatus.created,
        description=f"Wallet topup Rs.{amount}",
    )
    db.add(payment)
    await db.commit()
    return {
        "order_id": razorpay_order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": settings.RAZORPAY_KEY_ID,
        "user_name": user.full_name,
        "user_phone": user.phone,
        "user_email": user.email or "",
    }


async def verify_payment_service(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    db: AsyncSession
) -> dict:
    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    if expected_signature != razorpay_signature:
        raise ValueError("Invalid payment signature")
    result = await db.execute(
        select(Payment).where(Payment.gateway_order_id == razorpay_order_id)
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise ValueError("Payment record not found")
    if payment.status == PaymentStatus.success:
        return {"message": "Payment already processed"}
    payment.gateway_payment_id = razorpay_payment_id
    payment.gateway_signature = razorpay_signature
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
        description="Wallet topup via Razorpay",
        reference_id=razorpay_payment_id,
        db=db,
    )
    return {"message": "Payment verified and wallet credited"}


async def webhook_payment_service(
    payload: bytes,
    signature: str,
    db: AsyncSession
) -> dict:
    try:
        razorpay_client.utility.verify_webhook_signature(
            payload.decode(),
            signature,
            settings.RAZORPAY_KEY_SECRET
        )
    except Exception:
        raise ValueError("Invalid webhook signature")
    data = json.loads(payload)
    event = data.get("event")
    if event == "payment.captured":
        payment_entity = data["payload"]["payment"]["entity"]
        order_id = payment_entity.get("order_id")
        payment_id = payment_entity.get("id")
        result = await db.execute(
            select(Payment).where(Payment.gateway_order_id == order_id)
        )
        payment = result.scalar_one_or_none()
        if payment and payment.status != PaymentStatus.success:
            payment.gateway_payment_id = payment_id
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
                description="Wallet topup via Razorpay webhook",
                reference_id=payment_id,
                db=db,
            )
    return {"status": "ok"}