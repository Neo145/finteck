from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.schemas.kyc import KYCSubmitRequest, KYCResponse, KYCReviewRequest
from app.services.kyc_service import (
    submit_kyc_service,
    get_kyc_service,
    get_all_kyc_service,
    review_kyc_service
)

router = APIRouter(prefix="/kyc", tags=["KYC"])


@router.post("/submit", response_model=KYCResponse)
async def submit_kyc(
    data: KYCSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        kyc = await submit_kyc_service(current_user, data, db)
        return kyc
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/status", response_model=KYCResponse)
async def get_kyc_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        kyc = await get_kyc_service(current_user, db)
        return kyc
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/admin/all", response_model=List[KYCResponse])
async def get_all_kyc(
    status: str = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    kyc_list = await get_all_kyc_service(db, status)
    return kyc_list


@router.put("/admin/review/{kyc_id}", response_model=KYCResponse)
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