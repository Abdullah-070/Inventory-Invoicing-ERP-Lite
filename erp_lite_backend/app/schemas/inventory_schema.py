"""
Inventory / Stock transaction schemas.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class StockTransactionResponse(BaseModel):
    id: int
    product_id: int
    type: str
    quantity: int
    reference_type: str
    reference_id: Optional[int]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class StockAdjustmentRequest(BaseModel):
    product_id: int
    quantity: int = Field(..., ne=0)
    notes: Optional[str] = None
