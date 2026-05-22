from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.db.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.schemas.admin import (
    AdminUserResponse,
    AdminUpdateUserRequest,
    AdminTransactionResponse,
    AdminDashboardStats,
    AdminTransactionListResponse
)
from app.schemas.kyc import KYCResponse, KYCReviewRequest
from app.services.admin_service import (
    get_all_users_service,
    update_user_service,
    get_all_transactions_service,
    get_dashboard_stats_service
)
from app.services.kyc_service import get_all_kyc_service, review_kyc_service

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminDashboardStats)
async def get_dashboard_stats(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    stats = await get_dashboard_stats_service(db)
    return stats


@router.get("/users")
async def get_all_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await get_all_users_service(db, page, page_size, search)
    return result["users"]


@router.put("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: str,
    data: AdminUpdateUserRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    try:
        user = await update_user_service(user_id, data, db)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/transactions", response_model=AdminTransactionListResponse)
async def get_all_transactions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    transaction_type: Optional[str] = None,
    status: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await get_all_transactions_service(
        db, page, page_size, transaction_type, status
    )
    return result


@router.get("/kyc", response_model=List[KYCResponse])
async def get_all_kyc(
    status: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    kyc_list = await get_all_kyc_service(db, status)
    return kyc_list


@router.put("/kyc/{kyc_id}", response_model=KYCResponse)
async def review_kyc(
    kyc_id: str,
    data: KYCReviewRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    try:
        kyc = await review_kyc_service(kyc_id, admin, data, db)
        return kyc
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/bill-payments")
async def get_all_bill_payments(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    from app.models.bill_payment import BillPayment
    result = await db.execute(
        select(BillPayment).order_by(BillPayment.created_at.desc()).limit(100)
    )
    bills = result.scalars().all()
    return [
        {
            "id": str(b.id),
            "user_id": str(b.user_id),
            "category": b.category,
            "biller_name": b.biller_name,
            "consumer_number": b.consumer_number,
            "amount": str(b.amount),
            "status": b.status,
            "reference_id": b.reference_id,
            "operator_ref": b.operator_ref,
            "created_at": b.created_at.isoformat(),
        }
        for b in bills
    ]


@router.get("/recharges")
async def get_all_recharges(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    from app.models.recharge import Recharge
    result = await db.execute(
        select(Recharge).order_by(Recharge.created_at.desc()).limit(100)
    )
    recharges = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "user_id": str(r.user_id),
            "mobile_number": r.mobile_number,
            "operator": r.operator,
            "recharge_type": r.recharge_type,
            "amount": str(r.amount),
            "plan_description": r.plan_description,
            "status": r.status,
            "reference_id": r.reference_id,
            "operator_ref": r.operator_ref,
            "created_at": r.created_at.isoformat(),
        }
        for r in recharges
    ]