from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from decimal import Decimal
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.payment_link import (
    CreatePaymentLinkRequest,
    PaymentLinkResponse,
    PayLinkRequest
)
from app.services.payment_link_service import (
    create_payment_link_service,
    get_payment_links_service,
    get_payment_link_by_code_service,
    pay_via_link_service,
    cancel_payment_link_service
)

router = APIRouter(prefix="/payment-links", tags=["Payment Links"])

BASE_URL = "http://localhost:3000"


def format_link(link, base_url: str = BASE_URL) -> dict:
    data = {
        "id": link.id,
        "user_id": link.user_id,
        "title": link.title,
        "description": link.description,
        "amount": link.amount,
        "is_fixed_amount": link.is_fixed_amount,
        "link_code": link.link_code,
        "status": link.status,
        "total_collected": link.total_collected,
        "payment_url": f"{base_url}/pay/{link.link_code}",
        "created_at": link.created_at,
    }
    return data


@router.post("/create", response_model=PaymentLinkResponse)
async def create_payment_link(
    data: CreatePaymentLinkRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        link = await create_payment_link_service(current_user, data, db)
        return format_link(link)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/my-links", response_model=List[PaymentLinkResponse])
async def get_my_links(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    links = await get_payment_links_service(current_user, db)
    return [format_link(link) for link in links]


@router.get("/{link_code}", response_model=PaymentLinkResponse)
async def get_payment_link(
    link_code: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        link = await get_payment_link_by_code_service(link_code, db)
        return format_link(link)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/{link_code}/pay")
async def pay_via_link(
    link_code: str,
    data: PayLinkRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await pay_via_link_service(
            link_code, current_user, data.amount, db
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{link_id}/cancel", response_model=PaymentLinkResponse)
async def cancel_payment_link(
    link_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        link = await cancel_payment_link_service(link_id, current_user, db)
        return format_link(link)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )