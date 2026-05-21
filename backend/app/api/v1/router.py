from fastapi import APIRouter
from app.api.v1.endpoints import auth, wallet, users, payments, kyc, admin, payment_links, cashfree

api_router = APIRouter(prefix="/v1")
api_router.include_router(auth.router)
api_router.include_router(wallet.router)
api_router.include_router(users.router)
api_router.include_router(payments.router)
api_router.include_router(kyc.router)
api_router.include_router(admin.router)
api_router.include_router(payment_links.router)
api_router.include_router(cashfree.router)