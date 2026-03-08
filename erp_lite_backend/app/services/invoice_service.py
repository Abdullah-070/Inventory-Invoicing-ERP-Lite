"""
Service layer - business logic for invoices (wraps sales order + PDF generation).
"""
from typing import Optional
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models import SalesOrder, OrderStatus, Customer
from app.repositories import SalesOrderRepository, BaseRepository
from app.utils.invoice_generator import InvoiceGenerator


class InvoiceService:
    """Invoice generation and management service."""

    def __init__(self, db: Session):
        self.db = db
        self.order_repo = SalesOrderRepository(db, SalesOrder)
        self.customer_repo = BaseRepository(db, Customer)
        self.pdf_gen = InvoiceGenerator()

    def generate_invoice_number(self, order_id: int) -> str:
        """Generate a unique sequential invoice number in INV-YYYY-XXXX format."""
        from datetime import datetime
        year = datetime.now().year
        return f"INV-{year}-{1000 + order_id}"

    def create_invoice(self, order_id: int) -> SalesOrder:
        """
        Assign an invoice number to a confirmed / paid order.
        Returns the updated order.
        """
        order = self.order_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        if order.status not in (OrderStatus.CONFIRMED.value, OrderStatus.PAID.value):
            raise ValueError("Invoice can only be generated for confirmed/paid orders")
        if order.invoice_number:
            return order  # already has one

        order.invoice_number = self.generate_invoice_number(order_id)
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return order

    def calculate_totals(self, order_id: int) -> dict:
        """Return a summary dict of order totals."""
        order = self.order_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        return {
            "subtotal": float(order.subtotal or 0),
            "tax_amount": float(order.tax_amount or 0),
            "discount_amount": float(order.discount_amount or 0),
            "total_amount": float(order.total_amount or 0),
        }

    def generate_pdf(self, order_id: int) -> bytes:
        """Generate and return PDF bytes for an invoice."""
        order = self.order_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        if not order.invoice_number:
            # Auto-assign invoice number if missing
            order = self.create_invoice(order_id)

        customer = self.customer_repo.get_by_id(order.customer_id)

        order_data = {
            "id": order.id,
            "invoice_number": order.invoice_number,
            "status": order.status,
            "subtotal": float(order.subtotal or 0),
            "tax_amount": float(order.tax_amount or 0),
            "discount_amount": float(order.discount_amount or 0),
            "total_amount": float(order.total_amount or 0),
            "created_at": order.created_at.isoformat() if order.created_at else "",
        }
        customer_data = {
            "name": customer.name if customer else "N/A",
            "email": customer.email if customer else "",
            "address": customer.address if customer else "",
        }
        items_data = [
            {
                "product_name": item.product.name if item.product else f"Product #{item.product_id}",
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "subtotal": float(item.subtotal),
            }
            for item in order.items
        ]

        pdf_bytes = self.pdf_gen.generate_invoice_pdf(order_data, customer_data, items_data)
        # persist file
        self.pdf_gen.save_invoice(pdf_bytes, order.invoice_number)
        return pdf_bytes
