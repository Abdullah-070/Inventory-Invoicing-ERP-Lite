"""
Payment schemas.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    entity_type: str  # CUSTOMER or SUPPLIER
    entity_id: int
    amount: Decimal = Field(..., gt=0)
    payment_method: str
    reference_note: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    entity_type: str
    customer_id: Optional[int]
    supplier_id: Optional[int]
    amount: Decimal
    payment_method: str
    reference_note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
