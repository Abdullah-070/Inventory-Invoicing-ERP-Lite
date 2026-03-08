"""
Payment and Ledger models.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Payment(Base):
    """Payment records for customers and suppliers."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)  # CUSTOMER or SUPPLIER
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True, index=True)
    amount = Column(Numeric(18, 2), nullable=False)
    payment_method = Column(String(50), nullable=False)
    reference_note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    customer = relationship("Customer", back_populates="payments")
    supplier = relationship("Supplier", back_populates="payments")

    __table_args__ = (
        Index("idx_payment_entity", "entity_type"),
        Index("idx_payment_customer", "customer_id"),
        Index("idx_payment_supplier", "supplier_id"),
    )


class LedgerEntry(Base):
    """Ledger entries for accounting."""
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True, index=True)
    debit = Column(Numeric(18, 2), default=0, nullable=False)
    credit = Column(Numeric(18, 2), default=0, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    __table_args__ = (
        Index("idx_ledger_entity", "entity_type"),
        Index("idx_ledger_customer", "customer_id"),
        Index("idx_ledger_supplier", "supplier_id"),
        Index("idx_ledger_date", "created_at"),
    )
