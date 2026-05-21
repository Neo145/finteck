from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.wallet import (
    WalletResponse,
    TransactionListResponse,
    WalletWithTransactionsResponse
)
from app.services.wallet_service import (
    get_wallet_service,
    get_transactions_service,
    credit_wallet_service,
)
from app.models.wallet import TransactionCategory
from decimal import Decimal
import uuid

router = APIRouter(prefix="/wallet", tags=["Wallet"])


@router.get("/balance", response_model=WalletResponse)
async def get_balance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        wallet = await get_wallet_service(current_user, db)
        return wallet
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/transactions", response_model=TransactionListResponse)
async def get_transactions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await get_transactions_service(
        current_user, db, page, page_size
    )
    return result


@router.post("/add-money/simulate", response_model=WalletResponse)
async def simulate_add_money(
    amount: Decimal = Query(ge=1, le=100000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Simulate adding money to wallet (dev only).
    Real payment gateway integration comes next.
    """
    try:
        wallet = await get_wallet_service(current_user, db)
        await credit_wallet_service(
            wallet=wallet,
            user=current_user,
            amount=amount,
            category=TransactionCategory.wallet_topup,
            description="Simulated wallet top-up",
            reference_id=f"SIM-{uuid.uuid4().hex[:12].upper()}",
            db=db,
        )
        updated_wallet = await get_wallet_service(current_user, db)
        return updated_wallet
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )