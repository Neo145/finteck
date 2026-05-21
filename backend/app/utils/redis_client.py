from app.core.config import settings

otp_store = {}
token_store = {}


async def set_otp(phone: str, otp: str) -> None:
    otp_store[f"otp:{phone}"] = otp


async def get_otp(phone: str) -> str | None:
    return otp_store.get(f"otp:{phone}")


async def delete_otp(phone: str) -> None:
    otp_store.pop(f"otp:{phone}", None)


async def set_refresh_token(user_id: str, token: str) -> None:
    token_store[f"refresh:{user_id}"] = token


async def get_refresh_token(user_id: str) -> str | None:
    return token_store.get(f"refresh:{user_id}")


async def delete_refresh_token(user_id: str) -> None:
    token_store.pop(f"refresh:{user_id}", None)