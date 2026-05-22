from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.db.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.schemas.withdrawal import (
    WithdrawalRequest,
    WithdrawalResponse,
    AdminUpdateWithdrawalRequest
)
from app.services.withdrawal_service import (
    create_withdrawal_service,
    get_user_withdrawals_service,
    get_all_withdrawals_service,
    update_withdrawal_service
)

router = APIRouter(prefix="/withdrawals", tags=["Withdrawals"])


@router.post("/request", response_model=WithdrawalResponse)
async def request_withdrawal(
    data: WithdrawalRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        withdrawal = await create_withdrawal_service(current_user, data, db)
        return withdrawal
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/my-withdrawals", response_model=List[WithdrawalResponse])
async def get_my_withdrawals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    withdrawals = await get_user_withdrawals_service(current_user, db)
    return withdrawals


@router.get("/admin/all", response_model=List[WithdrawalResponse])
async def get_all_withdrawals(
    status: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    withdrawals = await get_all_withdrawals_service(db, status)
    return withdrawals


@router.put("/admin/{withdrawal_id}", response_model=WithdrawalResponse)
async def update_withdrawal(
    withdrawal_id: str,
    data: AdminUpdateWithdrawalRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    try:
        withdrawal = await update_withdrawal_service(
            withdrawal_id, admin, data, db
        )
        return withdrawal
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )