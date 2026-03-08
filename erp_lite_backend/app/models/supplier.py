"""
Supplier model.
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Supplier(Base):
    """Supplier model."""
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    purchases = relationship("Purchase", back_populates="supplier", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="supplier", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_supplier_name", "name"),
        Index("idx_supplier_email", "email"),
    )
