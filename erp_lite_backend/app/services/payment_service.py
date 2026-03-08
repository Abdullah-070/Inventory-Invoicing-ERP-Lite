"""
Service layer - business logic for payments and ledger entries.
"""
from typing import List, Optional
from decimal import Decimal

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import (
    Payment, LedgerEntry, Customer, Supplier, SalesOrder,
    EntityType, PaymentMethod, OrderStatus,
)
from app.repositories import BaseRepository


class PaymentService:
    """Payment recording and balance calculation service."""

    def __init__(self, db: Session):
        self.db = db

    # ---------- record ----------

    def record_payment(
        self,
        entity_type: str,
        entity_id: int,
        amount: float,
        payment_method: str,
        reference_note: str = None,
    ) -> Payment:
        """
        Record a payment from a customer or to a supplier.
        Also creates a ledger entry and, for customers, updates paid orders.
        """
        if entity_type == EntityType.CUSTOMER.value:
            entity = self.db.query(Customer).get(entity_id)
            if not entity:
                raise ValueError("Customer not found")
            payment = Payment(
                entity_type=entity_type,
                customer_id=entity_id,
                amount=amount,
                payment_method=payment_method,
                reference_note=reference_note,
            )
            # ledger: customer pays -> credit
            ledger = LedgerEntry(
                entity_type=entity_type,
                customer_id=entity_id,
                credit=amount,
                description=reference_note or f"Payment received – {payment_method}",
            )
        elif entity_type == EntityType.SUPPLIER.value:
            entity = self.db.query(Supplier).get(entity_id)
            if not entity:
                raise ValueError("Supplier not found")
            payment = Payment(
                entity_type=entity_type,
                supplier_id=entity_id,
                amount=amount,
                payment_method=payment_method,
                reference_note=reference_note,
            )
            # ledger: pay supplier -> debit
            ledger = LedgerEntry(
                entity_type=entity_type,
                supplier_id=entity_id,
                debit=amount,
                description=reference_note or f"Payment to supplier – {payment_method}",
            )
        else:
            raise ValueError("entity_type must be CUSTOMER or SUPPLIER")

        self.db.add(payment)
        self.db.add(ledger)
        self.db.commit()
        self.db.refresh(payment)
        return payment

    # ---------- balance ----------

    def calculate_customer_balance(self, customer_id: int) -> dict:
        """
        Calculate outstanding balance for a customer.
        Balance = total invoiced – total paid.
        """
        total_invoiced = (
            self.db.query(func.coalesce(func.sum(SalesOrder.total_amount), 0))
            .filter(
                SalesOrder.customer_id == customer_id,
                SalesOrder.status.in_([OrderStatus.CONFIRMED.value, OrderStatus.PAID.value]),
            )
            .scalar()
        )
        total_paid = (
            self.db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(Payment.customer_id == customer_id)
            .scalar()
        )
        return {
            "customer_id": customer_id,
            "total_invoiced": float(total_invoiced),
            "total_paid": float(total_paid),
            "outstanding": round(float(total_invoiced) - float(total_paid), 2),
        }

    def calculate_supplier_balance(self, supplier_id: int) -> dict:
        """Calculate balance owed to a supplier."""
        from app.models import Purchase, PurchaseStatus
        total_purchased = (
            self.db.query(func.coalesce(func.sum(Purchase.total_cost), 0))
            .filter(
                Purchase.supplier_id == supplier_id,
                Purchase.status == PurchaseStatus.RECEIVED.value,
            )
            .scalar()
        )
        total_paid = (
            self.db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(Payment.supplier_id == supplier_id)
            .scalar()
        )
        return {
            "supplier_id": supplier_id,
            "total_purchased": float(total_purchased),
            "total_paid": float(total_paid),
            "outstanding": round(float(total_purchased) - float(total_paid), 2),
        }

    # ---------- queries ----------

    def get_payments(self, entity_type: str = None, skip: int = 0, limit: int = 100) -> List[Payment]:
        q = self.db.query(Payment)
        if entity_type:
            q = q.filter(Payment.entity_type == entity_type)
        return q.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()

    def get_customer_payments(self, customer_id: int) -> List[Payment]:
        return (
            self.db.query(Payment)
            .filter(Payment.customer_id == customer_id)
            .order_by(Payment.created_at.desc())
            .all()
        )

    def get_supplier_payments(self, supplier_id: int) -> List[Payment]:
        return (
            self.db.query(Payment)
            .filter(Payment.supplier_id == supplier_id)
            .order_by(Payment.created_at.desc())
            .all()
        )

    def get_ledger_entries(self, entity_type: str = None, skip: int = 0, limit: int = 100) -> List[LedgerEntry]:
        q = self.db.query(LedgerEntry)
        if entity_type:
            q = q.filter(LedgerEntry.entity_type == entity_type)
        return q.order_by(LedgerEntry.created_at.desc()).offset(skip).limit(limit).all()
