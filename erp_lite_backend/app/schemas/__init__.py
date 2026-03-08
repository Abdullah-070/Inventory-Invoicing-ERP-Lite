"""
Pydantic schemas (DTOs) for API requests and responses.
Individual schema files per entity; re-exported here for backward compatibility.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


# ===== USER / AUTH SCHEMAS (remain here as they have no own file) =====
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=255)
    email: EmailStr
    role: str = "VIEWER"
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=255)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: int
    username: str
    role: str


# ===== RE-EXPORTS from individual schema modules =====
from app.schemas.product_schema import (
    CategoryBase, CategoryCreate, CategoryUpdate, CategoryResponse,
    ProductBase, ProductCreate, ProductUpdate, ProductResponse, ProductLowStockResponse,
)
from app.schemas.customer_schema import (
    CustomerBase, CustomerCreate, CustomerUpdate, CustomerResponse,
)
from app.schemas.supplier_schema import (
    SupplierBase, SupplierCreate, SupplierUpdate, SupplierResponse,
)
from app.schemas.invoice_schema import (
    SalesOrderItemCreate, SalesOrderItemResponse,
    SalesOrderBase, SalesOrderCreate, SalesOrderResponse,
)
from app.schemas.purchase_schema import (
    PurchaseItemCreate, PurchaseItemResponse,
    PurchaseBase, PurchaseCreate, PurchaseResponse,
)
from app.schemas.payment_schema import PaymentCreate, PaymentResponse
from app.schemas.inventory_schema import StockTransactionResponse, StockAdjustmentRequest
