from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.bbps import (
    BillerResponse,
    FetchBillRequest,
    BillDetailsResponse,
    PayBillRequest,
    BillPaymentResponse
)
from app.services.bbps_service import (
    get_billers_service,
    fetch_bill_service,
    pay_bill_service,
    get_bill_history_service
)

router = APIRouter(prefix="/bbps", tags=["Bill Pay (BBPS)"])


@router.get("/billers", response_model=List[BillerResponse])
async def get_billers(
    category: str = Query(...),
    current_user: User = Depends(get_current_user)
):
    billers = get_billers_service(category)
    return billers


@router.post("/fetch-bill", response_model=BillDetailsResponse)
async def fetch_bill(
    data: FetchBillRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        bill = await fetch_bill_service(
            data.biller_id,
            data.consumer_number,
            data.category
        )
        return bill
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/pay", response_model=BillPaymentResponse)
async def pay_bill(
    data: PayBillRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        payment = await pay_bill_service(
            user=current_user,
            biller_id=data.biller_id,
            biller_name=data.biller_name,
            consumer_number=data.consumer_number,
            amount=data.amount,
            category=data.category,
            db=db
        )
        return payment
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/history", response_model=List[BillPaymentResponse])
async def get_bill_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    history = await get_bill_history_service(current_user, db)
    return history