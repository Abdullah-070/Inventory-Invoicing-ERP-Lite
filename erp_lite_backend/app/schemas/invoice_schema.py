"""
Invoice / Sales Order schemas.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field


# ===== SALES ORDER ITEM SCHEMAS =====
class SalesOrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)


class SalesOrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    class Config:
        from_attributes = True


# ===== SALES ORDER / INVOICE SCHEMAS =====
class SalesOrderBase(BaseModel):
    customer_id: int
    items: List[SalesOrderItemCreate]
    tax_amount: Decimal = Field(default=0, ge=0)
    discount_amount: Decimal = Field(default=0, ge=0)


class SalesOrderCreate(SalesOrderBase):
    pass


class SalesOrderResponse(BaseModel):
    id: int
    customer_id: int
    invoice_number: Optional[str]
    status: str
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    items: List[SalesOrderItemResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
