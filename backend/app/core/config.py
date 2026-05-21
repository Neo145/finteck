from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "FintechPlatform"
    DEBUG: bool = False
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str
    ASYNC_DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379"

    ALLOWED_ORIGINS: str = "http://localhost:3000"

    OTP_EXPIRE_SECONDS: int = 300

    SMS_API_KEY: str = ""
    SMS_SENDER_ID: str = ""

    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    CASHFREE_APP_ID: str = ""
    CASHFREE_SECRET_KEY: str = ""

    def get_allowed_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()