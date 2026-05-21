import redis.asyncio as aioredis
from app.core.config import settings

redis_client = aioredis.from_url(
    settings.REDIS_URL,
    encoding="utf-8",
    decode_responses=True,
)


async def set_otp(phone: str, otp: str) -> None:
    key = f"otp:{phone}"
    await redis_client.setex(key, settings.OTP_EXPIRE_SECONDS, otp)


async def get_otp(phone: str) -> str | None:
    key = f"otp:{phone}"
    return await redis_client.get(key)


async def delete_otp(phone: str) -> None:
    key = f"otp:{phone}"
    await redis_client.delete(key)


async def set_refresh_token(user_id: str, token: str) -> None:
    key = f"refresh:{user_id}"
    await redis_client.setex(
        key,
        settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        token,
    )


async def get_refresh_token(user_id: str) -> str | None:
    key = f"refresh:{user_id}"
    return await redis_client.get(key)


async def delete_refresh_token(user_id: str) -> None:
    key = f"refresh:{user_id}"
    await redis_client.delete(key)