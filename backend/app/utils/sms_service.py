import httpx
from app.core.config import settings


async def send_otp_sms(phone: str, otp: str) -> bool:
    if not settings.SMS_API_KEY:
        print(f"SMS_API_KEY not set. OTP for {phone}: {otp}")
        return False

    try:
        message = f"{otp} is your OTP for FintechPay login. Valid for 5 minutes. Do not share with anyone."

        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.fast2sms.com/dev/bulkV2",
                params={
                    "authorization": settings.SMS_API_KEY,
                    "route": "q",
                    "message": message,
                    "flash": "0",
                    "numbers": phone,
                },
                timeout=10.0
            )
            data = response.json()
            print(f"Fast2SMS response: {data}")
            if data.get("return") == True:
                print(f"OTP SMS sent successfully to {phone}")
                return True
            else:
                print(f"SMS failed: {data}")
                return False
    except Exception as e:
        print(f"SMS error: {e}")
        return False