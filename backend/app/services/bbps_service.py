import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
from app.models.user import User
from app.models.wallet import TransactionCategory
from app.models.bill_payment import BillPayment, BillCategory, BillPaymentStatus
from app.services.wallet_service import get_wallet_service, debit_wallet_service

MOCK_BILLERS = {
    "electricity": [
        {"id": "APSPDCL", "name": "APSPDCL - Andhra Pradesh", "logo": "⚡"},
        {"id": "TSSPDCL", "name": "TSSPDCL - Telangana", "logo": "⚡"},
        {"id": "BESCOM", "name": "BESCOM - Bangalore", "logo": "⚡"},
        {"id": "MSEDCL", "name": "MSEDCL - Maharashtra", "logo": "⚡"},
        {"id": "BSES", "name": "BSES - Delhi", "logo": "⚡"},
    ],
    "water": [
        {"id": "HMWSSB", "name": "HMWSSB - Hyderabad", "logo": "💧"},
        {"id": "BWSSB", "name": "BWSSB - Bangalore", "logo": "💧"},
        {"id": "DJB", "name": "DJB - Delhi Jal Board", "logo": "💧"},
    ],
    "gas": [
        {"id": "MGL", "name": "Mahanagar Gas", "logo": "🔥"},
        {"id": "IGL", "name": "Indraprastha Gas", "logo": "🔥"},
        {"id": "GAIL", "name": "GAIL Gas", "logo": "🔥"},
    ],
    "dth": [
        {"id": "TATASKY", "name": "Tata Play", "logo": "📺"},
        {"id": "DISHTV", "name": "Dish TV", "logo": "📺"},
        {"id": "AIRTEL_DTH", "name": "Airtel Digital TV", "logo": "📺"},
        {"id": "SUN_DIRECT", "name": "Sun Direct", "logo": "📺"},
    ],
    "broadband": [
        {"id": "AIRTEL_BB", "name": "Airtel Broadband", "logo": "🌐"},
        {"id": "BSNL_BB", "name": "BSNL Broadband", "logo": "🌐"},
        {"id": "JIOFIBER", "name": "JioFiber", "logo": "🌐"},
        {"id": "ACT", "name": "ACT Fibernet", "logo": "🌐"},
    ],
    "mobile_postpaid": [
        {"id": "AIRTEL_POST", "name": "Airtel Postpaid", "logo": "📱"},
        {"id": "JIO_POST", "name": "Jio Postpaid", "logo": "📱"},
        {"id": "VI_POST", "name": "Vi Postpaid", "logo": "📱"},
        {"id": "BSNL_POST", "name": "BSNL Postpaid", "logo": "📱"},
    ],
    "insurance": [
        {"id": "LIC", "name": "LIC Premium", "logo": "🛡️"},
        {"id": "HDFC_LIFE", "name": "HDFC Life Insurance", "logo": "🛡️"},
        {"id": "SBI_LIFE", "name": "SBI Life Insurance", "logo": "🛡️"},
    ],
    "loan_emi": [
        {"id": "HDFC_LOAN", "name": "HDFC Bank Loan", "logo": "🏦"},
        {"id": "SBI_LOAN", "name": "SBI Loan", "logo": "🏦"},
        {"id": "ICICI_LOAN", "name": "ICICI Bank Loan", "logo": "🏦"},
        {"id": "BAJAJ_LOAN", "name": "Bajaj Finserv", "logo": "🏦"},
    ],
}


def get_billers_service(category: str) -> list:
    return MOCK_BILLERS.get(category, [])


async def fetch_bill_service(
    biller_id: str,
    consumer_number: str,
    category: str
) -> dict:
    import random
    amount = round(random.uniform(200, 5000), 2)
    due_date = "2026-06-15"

    biller_name = biller_id
    for cat_billers in MOCK_BILLERS.values():
        for b in cat_billers:
            if b["id"] == biller_id:
                biller_name = b["name"]
                break

    return {
        "consumer_number": consumer_number,
        "biller_id": biller_id,
        "biller_name": biller_name,
        "amount": amount,
        "due_date": due_date,
        "bill_date": "2026-05-01",
        "consumer_name": "Consumer",
        "status": "unpaid",
    }


async def pay_bill_service(
    user: User,
    biller_id: str,
    biller_name: str,
    consumer_number: str,
    amount: Decimal,
    category: str,
    db: AsyncSession
) -> BillPayment:
    wallet = await get_wallet_service(user, db)

    if wallet.balance < amount:
        raise ValueError(f"Insufficient balance. Available: ₹{wallet.balance}")

    reference_id = f"BILL-{uuid.uuid4().hex[:12].upper()}"

    await debit_wallet_service(
        wallet=wallet,
        user=user,
        amount=amount,
        category=TransactionCategory.payment,
        description=f"Bill payment - {biller_name} ({consumer_number})",
        reference_id=reference_id,
        db=db,
    )

    bill_payment = BillPayment(
        id=uuid.uuid4(),
        user_id=user.id,
        category=BillCategory(category),
        biller_name=biller_name,
        consumer_number=consumer_number,
        amount=amount,
        status=BillPaymentStatus.success,
        reference_id=reference_id,
        operator_ref=f"OP{uuid.uuid4().hex[:8].upper()}",
        remarks=f"Bill paid successfully",
    )
    db.add(bill_payment)
    await db.commit()
    await db.refresh(bill_payment)
    return bill_payment


async def get_bill_history_service(
    user: User,
    db: AsyncSession
) -> list:
    result = await db.execute(
        select(BillPayment)
        .where(BillPayment.user_id == user.id)
        .order_by(BillPayment.created_at.desc())
    )
    return result.scalars().all()