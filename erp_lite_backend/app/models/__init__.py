"""
SQLAlchemy models for ERP-Lite system.
All models are defined in separate files per entity, then re-exported here.
"""
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Index
)
from sqlalchemy.sql import func

from app.core.database import Base

# Import enums from dedicated module (avoids circular imports)
from app.models.enums import (
    UserRole, StockTransactionType, StockReferenceType,
    OrderStatus, PurchaseStatus, PaymentMethod, EntityType,
)


# ===== USER (lives in __init__ as it has no cross-model deps) =====
class User(Base):
    """User model for authentication and authorization."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.VIEWER.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_user_username", "username"),
        Index("idx_user_email", "email"),
    )


# ===== RE-EXPORT from individual model files =====
from app.models.product import Category, Product
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.inventory import StockTransaction
from app.models.order import SalesOrder, SalesOrderItem
from app.models.purchase import Purchase, PurchaseItem
from app.models.payment import Payment, LedgerEntry

__all__ = [
    # Enums
    "UserRole", "StockTransactionType", "StockReferenceType",
    "OrderStatus", "PurchaseStatus", "PaymentMethod", "EntityType",
    # Models
    "User", "Category", "Product", "StockTransaction",
    "Customer", "Supplier",
    "SalesOrder", "SalesOrderItem",
    "Purchase", "PurchaseItem",
    "Payment", "LedgerEntry",
]
