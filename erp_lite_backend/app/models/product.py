"""
Product model.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Category(Base):
    """Product category model."""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    products = relationship("Product", back_populates="category", cascade="all, delete-orphan")


class Product(Base):
    """Product inventory model."""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    barcode = Column(String(100), unique=True, nullable=True)
    cost_price = Column(Numeric(18, 2), nullable=False)
    selling_price = Column(Numeric(18, 2), nullable=False)
    stock_quantity = Column(Integer, default=0, nullable=False)
    reorder_level = Column(Integer, default=10, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    category = relationship("Category", back_populates="products")
    stock_transactions = relationship("StockTransaction", back_populates="product", cascade="all, delete-orphan")
    sales_items = relationship("SalesOrderItem", back_populates="product", cascade="all, delete-orphan")
    purchase_items = relationship("PurchaseItem", back_populates="product", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_product_sku", "sku"),
        Index("idx_product_name", "name"),
        Index("idx_product_category", "category_id"),
    )
