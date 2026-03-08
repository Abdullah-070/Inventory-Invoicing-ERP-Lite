"""
Purchase schemas.
"""
from datetime import datetime
from decimal import Decimal
from typing import List
from pydantic import BaseModel, Field


class PurchaseItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_cost: Decimal = Field(..., ge=0)


class PurchaseItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_cost: Decimal
    subtotal: Decimal

    class Config:
        from_attributes = True


class PurchaseBase(BaseModel):
    supplier_id: int
    items: List[PurchaseItemCreate]


class PurchaseCreate(PurchaseBase):
    pass


class PurchaseResponse(BaseModel):
    id: int
    supplier_id: int
    status: str
    total_cost: Decimal
    items: List[PurchaseItemResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
