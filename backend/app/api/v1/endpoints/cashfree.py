from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from decimal import Decimal
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.cashfree_service import (
    create_cashfree_order_service,
    verify_cashfree_payment_service
)

router = APIRouter(prefix="/cashfree", tags=["Cashfree"])


@router.post("/create-order")
async def create_cashfree_order(
    amount: Decimal = Query(ge=1, le=100000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await create_cashfree_order_service(
            current_user, amount, db
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/verify")
async def verify_cashfree_payment(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await verify_cashfree_payment_service(order_id, db)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )