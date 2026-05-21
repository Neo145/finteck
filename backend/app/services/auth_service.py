from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.wallet import Wallet
from app.core.security import generate_otp, create_access_token, create_refresh_token, decode_token
from app.utils.redis_client import set_otp, get_otp, delete_otp, set_refresh_token, get_refresh_token
from app.utils.sms_service import send_otp_sms
from app.schemas.auth import SendOTPRequest, VerifyOTPRequest, TokenResponse
import uuid


async def send_otp_service(data: SendOTPRequest) -> dict:
    otp = generate_otp()
    await set_otp(data.phone, otp)

    sms_sent = await send_otp_sms(data.phone, otp)

    response = {
        "message": "OTP sent successfully",
        "phone": data.phone,
    }

    if not sms_sent:
        response["dev_otp"] = otp

    return response


async def verify_otp_service(
    data: VerifyOTPRequest,
    db: AsyncSession
) -> TokenResponse:
    stored_otp = await get_otp(data.phone)

    if not stored_otp:
        raise ValueError("OTP expired or not found. Please request a new OTP.")

    if stored_otp != data.otp:
        raise ValueError("Invalid OTP. Please try again.")

    await delete_otp(data.phone)

    result = await db.execute(select(User).where(User.phone == data.phone))
    user = result.scalar_one_or_none()

    if not user:
        full_name = data.full_name or "User"
        user = User(
            id=uuid.uuid4(),
            full_name=full_name,
            phone=data.phone,
            is_verified=True,
        )
        db.add(user)
        await db.flush()

        wallet = Wallet(
            id=uuid.uuid4(),
            user_id=user.id,
            balance=0.00,
        )
        db.add(wallet)
        await db.commit()
        await db.refresh(user)

    token_data = {"sub": str(user.id), "phone": user.phone, "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    await set_refresh_token(str(user.id), refresh_token)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


async def refresh_token_service(refresh_token: str) -> TokenResponse:
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")

        user_id = payload.get("sub")
        stored_token = await get_refresh_token(user_id)

        if not stored_token or stored_token != refresh_token:
            raise ValueError("Refresh token expired or invalid")

        token_data = {
            "sub": user_id,
            "phone": payload.get("phone"),
            "role": payload.get("role")
        }
        new_access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)
        await set_refresh_token(user_id, new_refresh_token)

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
        )
    except Exception as e:
        raise ValueError(str(e))