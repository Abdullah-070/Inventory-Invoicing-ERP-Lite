"""
Sales order / Invoice models.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import OrderStatus


class SalesOrder(Base):
    """Sales order model."""
    __tablename__ = "sales_orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    invoice_number = Column(String(50), unique=True, nullable=True, index=True)
    status = Column(String(50), default=OrderStatus.DRAFT.value, nullable=False, index=True)
    subtotal = Column(Numeric(18, 2), default=0, nullable=False)
    tax_amount = Column(Numeric(18, 2), default=0, nullable=False)
    discount_amount = Column(Numeric(18, 2), default=0, nullable=False)
    total_amount = Column(Numeric(18, 2), default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    customer = relationship("Customer", back_populates="sales_orders")
    items = relationship("SalesOrderItem", back_populates="order", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_sales_order_customer", "customer_id"),
        Index("idx_sales_order_status", "status"),
    )


class SalesOrderItem(Base):
    """Sales order line items."""
    __tablename__ = "sales_order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("sales_orders.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(18, 2), nullable=False)
    subtotal = Column(Numeric(18, 2), nullable=False)

    order = relationship("SalesOrder", back_populates="items")
    product = relationship("Product", back_populates="sales_items")

    __table_args__ = (
        Index("idx_sales_order_item_order", "order_id"),
        Index("idx_sales_order_item_product", "product_id"),
    )
