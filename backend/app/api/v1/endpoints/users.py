from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import (
    UserProfileResponse,
    UpdateProfileRequest,
    ChangePhoneRequest,
    UserStatsResponse
)
from app.schemas.auth import SendOTPRequest
from app.services.user_service import (
    get_profile_service,
    update_profile_service,
    change_phone_service,
    get_user_stats_service
)
from app.services.auth_service import send_otp_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
):
    return await get_profile_service(current_user)


@router.put("/me", response_model=UserProfileResponse)
async def update_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        user = await update_profile_service(current_user, data, db)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/me/send-phone-otp", status_code=status.HTTP_200_OK)
async def send_phone_change_otp(
    data: SendOTPRequest,
    current_user: User = Depends(get_current_user),
):
    try:
        result = await send_otp_service(data)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/me/change-phone", response_model=UserProfileResponse)
async def change_phone(
    data: ChangePhoneRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        user = await change_phone_service(
            current_user, data.new_phone, data.otp, db
        )
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/me/stats", response_model=UserStatsResponse)
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stats = await get_user_stats_service(current_user, db)
    return stats