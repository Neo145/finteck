from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User, KYCStatus
from app.models.kyc import KYC, KYCDocumentType, KYCStatus as KYCRecordStatus
from app.schemas.kyc import KYCSubmitRequest, KYCReviewRequest
import uuid


async def submit_kyc_service(
    user: User,
    data: KYCSubmitRequest,
    db: AsyncSession
) -> KYC:
    # Check if KYC already exists
    result = await db.execute(
        select(KYC).where(KYC.user_id == user.id)
    )
    existing = result.scalar_one_or_none()

    if existing and existing.status == KYCRecordStatus.approved:
        raise ValueError("KYC already approved")

    if existing:
        # Update existing KYC
        existing.document_type = KYCDocumentType(data.document_type)
        existing.document_number = data.document_number
        existing.status = KYCRecordStatus.submitted
        existing.rejection_reason = None
        await db.commit()
        await db.refresh(existing)
        return existing

    # Create new KYC record
    kyc = KYC(
        id=uuid.uuid4(),
        user_id=user.id,
        document_type=KYCDocumentType(data.document_type),
        document_number=data.document_number,
        status=KYCRecordStatus.submitted,
    )
    db.add(kyc)

    # Update user KYC status
    user.kyc_status = KYCStatus.submitted
    await db.commit()
    await db.refresh(kyc)
    return kyc


async def get_kyc_service(
    user: User,
    db: AsyncSession
) -> KYC:
    result = await db.execute(
        select(KYC).where(KYC.user_id == user.id)
    )
    kyc = result.scalar_one_or_none()
    if not kyc:
        raise ValueError("KYC not submitted yet")
    return kyc


async def get_all_kyc_service(
    db: AsyncSession,
    status: str = None
) -> list:
    query = select(KYC)
    if status:
        query = query.where(KYC.status == KYCRecordStatus(status))
    result = await db.execute(query.order_by(KYC.created_at.desc()))
    return result.scalars().all()


async def review_kyc_service(
    kyc_id: str,
    admin: User,
    data: KYCReviewRequest,
    db: AsyncSession
) -> KYC:
    result = await db.execute(
        select(KYC).where(KYC.id == kyc_id)
    )
    kyc = result.scalar_one_or_none()
    if not kyc:
        raise ValueError("KYC record not found")

    kyc.status = KYCRecordStatus(data.status)
    kyc.reviewed_by = admin.id
    kyc.rejection_reason = data.rejection_reason

    # Update user KYC status
    user_result = await db.execute(
        select(User).where(User.id == kyc.user_id)
    )
    user = user_result.scalar_one_or_none()
    if user:
        user.kyc_status = KYCStatus(data.status)

    await db.commit()
    await db.refresh(kyc)
    return kyc