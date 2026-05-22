from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime


class OperatorResponse(BaseModel):
    id: str
    name: str
    logo: str
    color: str


class PlanResponse(BaseModel):
    id: str
    amount: float
    validity: str
    description: str


class DoRechargeRequest(BaseModel):
    mobile_number: str
    operator: str
    recharge_type: str
    amount: Decimal
    plan_description: str

    @field_validator("mobile_number")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 10:
            raise ValueError("Enter valid 10 digit mobile number")
        return v

    @field_validator("operator")
    @classmethod
    def validate_operator(cls, v: str) -> str:
        if v not in ["airtel", "jio", "vi", "bsnl", "tataplay", "dishtv"]:
            raise ValueError("Invalid operator")
        return v


class RechargeResponse(BaseModel):
    id: UUID
    user_id: UUID
    mobile_number: str
    operator: str
    recharge_type: str
    amount: Decimal
    plan_description: Optional[str] = None
    status: str
    reference_id: Optional[str] = None
    operator_ref: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True