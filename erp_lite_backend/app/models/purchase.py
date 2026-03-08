"""
Purchase order models.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import PurchaseStatus


class Purchase(Base):
    """Purchase order model."""
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False, index=True)
    status = Column(String(50), default=PurchaseStatus.DRAFT.value, nullable=False, index=True)
    total_cost = Column(Numeric(18, 2), default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    supplier = relationship("Supplier", back_populates="purchases")
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_purchase_supplier", "supplier_id"),
        Index("idx_purchase_status", "status"),
    )


class PurchaseItem(Base):
    """Purchase order line items."""
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Numeric(18, 2), nullable=False)
    subtotal = Column(Numeric(18, 2), nullable=False)

    purchase = relationship("Purchase", back_populates="items")
    product = relationship("Product", back_populates="purchase_items")

    __table_args__ = (
        Index("idx_purchase_item_purchase", "purchase_id"),
        Index("idx_purchase_item_product", "product_id"),
    )
