"""
Inventory / Stock transaction model.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class StockTransaction(Base):
    """Stock transaction history - tracks all inventory movements."""
    __tablename__ = "stock_transactions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # IN, OUT, ADJUSTMENT
    quantity = Column(Integer, nullable=False)
    reference_type = Column(String(50), nullable=False)  # SALE, PURCHASE, MANUAL
    reference_id = Column(Integer, nullable=True, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    product = relationship("Product", back_populates="stock_transactions")

    __table_args__ = (
        Index("idx_stock_transaction_product", "product_id"),
        Index("idx_stock_transaction_reference", "reference_type", "reference_id"),
        Index("idx_stock_transaction_date", "created_at"),
    )
