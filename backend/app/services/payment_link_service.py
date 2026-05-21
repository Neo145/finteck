from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
from app.models.user import User
from app.models.wallet import Wallet, TransactionCategory
from app.models.payment_link import PaymentLink, PaymentLinkStatus
from app.services.wallet_service import get_wallet_service, credit_wallet_service
from app.schemas.payment_link import CreatePaymentLinkRequest
import uuid
import random
import string


def generate_link_code(length: int = 10) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=length))


async def create_payment_link_service(
    user: User,
    data: CreatePaymentLinkRequest,
    db: AsyncSession,
    base_url: str = "http://localhost:3000"
) -> PaymentLink:
    link_code = generate_link_code()

    payment_link = PaymentLink(
        id=uuid.uuid4(),
        user_id=user.id,
        title=data.title,
        description=data.description,
        amount=data.amount,
        is_fixed_amount=data.is_fixed_amount,
        link_code=link_code,
        status=PaymentLinkStatus.active,
        total_collected=Decimal("0.00"),
    )
    db.add(payment_link)
    await db.commit()
    await db.refresh(payment_link)
    return payment_link


async def get_payment_links_service(
    user: User,
    db: AsyncSession
) -> list:
    result = await db.execute(
        select(PaymentLink)
        .where(PaymentLink.user_id == user.id)
        .order_by(PaymentLink.created_at.desc())
    )
    return result.scalars().all()


async def get_payment_link_by_code_service(
    link_code: str,
    db: AsyncSession
) -> PaymentLink:
    result = await db.execute(
        select(PaymentLink).where(PaymentLink.link_code == link_code)
    )
    link = result.scalar_one_or_none()
    if not link:
        raise ValueError("Payment link not found")
    if link.status != PaymentLinkStatus.active:
        raise ValueError(f"Payment link is {link.status}")
    return link


async def pay_via_link_service(
    link_code: str,
    payer: User,
    amount: Decimal,
    db: AsyncSession
) -> dict:
    # Get payment link
    link = await get_payment_link_by_code_service(link_code, db)

    # Determine amount
    if link.is_fixed_amount:
        pay_amount = link.amount
    else:
        if not amount or amount <= 0:
            raise ValueError("Please enter a valid amount")
        pay_amount = amount

    # Debit payer wallet
    payer_wallet_result = await db.execute(
        select(Wallet).where(Wallet.user_id == payer.id)
    )
    payer_wallet = payer_wallet_result.scalar_one_or_none()
    if not payer_wallet:
        raise ValueError("Payer wallet not found")

    if payer_wallet.balance < pay_amount:
        raise ValueError("Insufficient wallet balance")

    # Debit from payer
    from app.services.wallet_service import debit_wallet_service
    await debit_wallet_service(
        wallet=payer_wallet,
        user=payer,
        amount=pay_amount,
        category=TransactionCategory.payment,
        description=f"Payment via link: {link.title}",
        reference_id=f"LINK-{uuid.uuid4().hex[:12].upper()}",
        db=db,
    )

    # Credit to link owner
    owner_wallet_result = await db.execute(
        select(Wallet).where(Wallet.user_id == link.user_id)
    )
    owner_wallet = owner_wallet_result.scalar_one_or_none()

    owner_result = await db.execute(
        select(User).where(User.id == link.user_id)
    )
    owner = owner_result.scalar_one_or_none()

    await credit_wallet_service(
        wallet=owner_wallet,
        user=owner,
        amount=pay_amount,
        category=TransactionCategory.payment,
        description=f"Payment received via link: {link.title}",
        reference_id=f"LINK-RCV-{uuid.uuid4().hex[:12].upper()}",
        db=db,
    )

    # Update total collected
    link.total_collected = (link.total_collected or Decimal("0")) + pay_amount
    await db.commit()

    return {
        "message": "Payment successful",
        "amount": str(pay_amount),
        "link_title": link.title,
    }


async def cancel_payment_link_service(
    link_id: str,
    user: User,
    db: AsyncSession
) -> PaymentLink:
    result = await db.execute(
        select(PaymentLink).where(
            PaymentLink.id == link_id,
            PaymentLink.user_id == user.id
        )
    )
    link = result.scalar_one_or_none()
    if not link:
        raise ValueError("Payment link not found")
    link.status = PaymentLinkStatus.cancelled
    await db.commit()
    await db.refresh(link)
    return link