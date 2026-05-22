from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.recharge import (
    OperatorResponse,
    PlanResponse,
    DoRechargeRequest,
    RechargeResponse
)
from app.services.recharge_service import (
    get_operators_service,
    get_plans_service,
    do_recharge_service,
    get_recharge_history_service
)

router = APIRouter(prefix="/recharge", tags=["Recharge"])


@router.get("/operators", response_model=List[OperatorResponse])
async def get_operators(
    current_user: User = Depends(get_current_user)
):
    return get_operators_service()


@router.get("/plans", response_model=List[PlanResponse])
async def get_plans(
    operator: str = Query(...),
    recharge_type: str = Query(default="prepaid"),
    current_user: User = Depends(get_current_user)
):
    plans = get_plans_service(operator, recharge_type)
    return plans


@router.post("/do-recharge", response_model=RechargeResponse)
async def do_recharge(
    data: DoRechargeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        recharge = await do_recharge_service(
            user=current_user,
            mobile_number=data.mobile_number,
            operator=data.operator,
            recharge_type=data.recharge_type,
            amount=data.amount,
            plan_description=data.plan_description,
            db=db
        )
        return recharge
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/history", response_model=List[RechargeResponse])
async def get_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    history = await get_recharge_history_service(current_user, db)
    return history