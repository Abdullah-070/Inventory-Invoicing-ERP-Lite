"""
Service layer - business logic for sales orders.
"""
from typing import List, Optional
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models import (
    SalesOrder, SalesOrderItem, Product, StockTransaction, Customer,
    OrderStatus, StockTransactionType, StockReferenceType
)
from app.repositories import BaseRepository, SalesOrderRepository, ProductRepository
from app.schemas import SalesOrderCreate
from app.services.invoice_service import InvoiceService


class SalesOrderService:
    """Sales order management service."""
    
    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db
        self.sales_order_repo = SalesOrderRepository(db, SalesOrder)
        self.product_repo = ProductRepository(db, Product)
        self.customer_repo = BaseRepository(db, Customer)
        self.stock_transaction_repo = BaseRepository(db, StockTransaction)
    
    def create_sales_order(self, order_data: SalesOrderCreate) -> SalesOrder:
        """
        Create a new sales order (initially in DRAFT status).
        
        Args:
            order_data: Sales order creation data
            
        Returns:
            Created sales order
            
        Raises:
            ValueError: If customer or product not found
        """
        # Verify customer exists
        customer = self.customer_repo.get_by_id(order_data.customer_id)
        if not customer:
            raise ValueError("Customer not found")
        
        # Calculate totals
        subtotal = Decimal("0")
        
        # Create order
        sales_order = SalesOrder(
            customer_id=order_data.customer_id,
            status=OrderStatus.DRAFT.value,
            tax_amount=order_data.tax_amount,
            discount_amount=order_data.discount_amount
        )
        self.db.add(sales_order)
        self.db.flush()  # Get the order ID without committing
        
        # Add items
        for item_data in order_data.items:
            product = self.product_repo.get_by_id(item_data.product_id)
            if not product:
                raise ValueError(f"Product {item_data.product_id} not found")
            
            subtotal_item = item_data.quantity * item_data.unit_price
            subtotal += subtotal_item
            
            item = SalesOrderItem(
                order_id=sales_order.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                subtotal=subtotal_item
            )
            self.db.add(item)
        
        # Update order totals
        sales_order.subtotal = subtotal
        sales_order.total_amount = subtotal + order_data.tax_amount - order_data.discount_amount
        
        self.db.commit()
        self.db.refresh(sales_order)
        return sales_order
    
    def get_sales_order(self, order_id: int) -> Optional[SalesOrder]:
        """Get sales order by ID."""
        return self.sales_order_repo.get_by_id(order_id)
    
    def get_customer_orders(self, customer_id: int, skip: int = 0, limit: int = 100) -> List[SalesOrder]:
        """Get all orders for a customer."""
        return self.sales_order_repo.get_by_customer(customer_id, skip, limit)
    
    def get_orders_by_status(self, status: str, skip: int = 0, limit: int = 100) -> List[SalesOrder]:
        """Get orders by status."""
        return self.sales_order_repo.get_by_status(status, skip, limit)
    
    def confirm_sales_order(self, order_id: int) -> Optional[SalesOrder]:
        """
        Confirm sales order and deduct stock.
        
        Args:
            order_id: Order ID
            
        Returns:
            Updated order
            
        Raises:
            ValueError: If order not found, invalid status, or insufficient stock
        """
        order = self.sales_order_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        
        if order.status != OrderStatus.DRAFT.value:
            raise ValueError(f"Order cannot be confirmed from {order.status} status")
        
        # Check stock availability
        for item in order.items:
            product = self.product_repo.get_by_id(item.product_id)
            if product.stock_quantity < item.quantity:
                raise ValueError(f"Insufficient stock for product {product.sku}")
        
        # Deduct stock and create transactions
        for item in order.items:
            product = self.product_repo.get_by_id(item.product_id)
            product.stock_quantity -= item.quantity
            self.db.add(product)
            
            # Create stock transaction
            transaction = StockTransaction(
                product_id=item.product_id,
                type=StockTransactionType.OUT.value,
                quantity=-item.quantity,
                reference_type=StockReferenceType.SALE.value,
                reference_id=order_id,
                notes=f"Sale Order #{order_id}"
            )
            self.db.add(transaction)
        
        # Update order status
        order.status = OrderStatus.CONFIRMED.value
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)

        # Auto-generate invoice number on confirmation
        invoice_service = InvoiceService(self.db)
        order = invoice_service.create_invoice(order.id)

        return order
    
    def mark_order_paid(self, order_id: int) -> Optional[SalesOrder]:
        """Mark order as paid."""
        order = self.sales_order_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        
        if order.status not in [OrderStatus.CONFIRMED.value, OrderStatus.PAID.value]:
            raise ValueError("Order must be confirmed before marking as paid")
        
        order.status = OrderStatus.PAID.value
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)

        # Ensure invoice number exists
        if not order.invoice_number:
            invoice_service = InvoiceService(self.db)
            order = invoice_service.create_invoice(order.id)

        return order
    
    def cancel_sales_order(self, order_id: int) -> Optional[SalesOrder]:
        """
        Cancel sales order.
        If stock was deducted, restore it.
        """
        order = self.sales_order_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        
        if order.status == OrderStatus.CANCELLED.value:
            raise ValueError("Order is already cancelled")
        
        # If order was confirmed, restore stock
        if order.status == OrderStatus.CONFIRMED.value:
            for item in order.items:
                product = self.product_repo.get_by_id(item.product_id)
                product.stock_quantity += item.quantity
                self.db.add(product)
                
                # Create adjustment transaction
                transaction = StockTransaction(
                    product_id=item.product_id,
                    type=StockTransactionType.IN.value,
                    quantity=item.quantity,
                    reference_type=StockReferenceType.SALE.value,
                    reference_id=order_id,
                    notes=f"Sale Order #{order_id} Cancelled - Stock Restored"
                )
                self.db.add(transaction)
        
        order.status = OrderStatus.CANCELLED.value
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        
        return order
    
    def generate_invoice_number(self, order_id: int) -> str:
        """Generate a unique sequential invoice number."""
        # Simple sequential format: INV-001001, INV-001002, etc.
        return f"INV-{order_id:06d}"
    
    def set_invoice_number(self, order_id: int) -> Optional[SalesOrder]:
        """Generate and set invoice number for confirmed order."""
        order = self.sales_order_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        
        if order.status not in [OrderStatus.CONFIRMED.value, OrderStatus.PAID.value]:
            raise ValueError("Invoice can only be generated for confirmed/paid orders")
        
        if not order.invoice_number:
            order.invoice_number = self.generate_invoice_number(order_id)
            self.db.add(order)
            self.db.commit()
            self.db.refresh(order)
        
        return order
