"""
Service layer - business logic for purchase orders.
"""
from typing import List, Optional
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models import (
    Purchase, PurchaseItem, Product, StockTransaction, Supplier,
    OrderStatus, StockTransactionType, StockReferenceType
)
from app.repositories import BaseRepository, PurchaseRepository, ProductRepository
from app.schemas import PurchaseCreate


class PurchaseOrderService:
    """Purchase order management service."""
    
    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db
        self.purchase_repo = PurchaseRepository(db, Purchase)
        self.product_repo = ProductRepository(db, Product)
        self.supplier_repo = BaseRepository(db, Supplier)
        self.stock_transaction_repo = BaseRepository(db, StockTransaction)
    
    def create_purchase_order(self, order_data: PurchaseCreate) -> Purchase:
        """
        Create a new purchase order (initially in DRAFT status).
        
        Args:
            order_data: Purchase order creation data
            
        Returns:
            Created purchase order
            
        Raises:
            ValueError: If supplier or product not found
        """
        # Verify supplier exists
        supplier = self.supplier_repo.get_by_id(order_data.supplier_id)
        if not supplier:
            raise ValueError("Supplier not found")
        
        # Calculate totals
        subtotal = Decimal("0")
        
        # Create order
        purchase_order = Purchase(
            supplier_id=order_data.supplier_id,
            status=OrderStatus.DRAFT.value,
            tax_amount=order_data.tax_amount,
            discount_amount=order_data.discount_amount
        )
        self.db.add(purchase_order)
        self.db.flush()  # Get the order ID without committing
        
        # Add items
        for item_data in order_data.items:
            product = self.product_repo.get_by_id(item_data.product_id)
            if not product:
                raise ValueError(f"Product {item_data.product_id} not found")
            
            subtotal_item = item_data.quantity * item_data.unit_price
            subtotal += subtotal_item
            
            item = PurchaseItem(
                order_id=purchase_order.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                subtotal=subtotal_item
            )
            self.db.add(item)
        
        # Update order totals
        purchase_order.subtotal = subtotal
        purchase_order.total_amount = subtotal + order_data.tax_amount - order_data.discount_amount
        
        self.db.commit()
        self.db.refresh(purchase_order)
        return purchase_order
    
    def get_purchase_order(self, order_id: int) -> Optional[Purchase]:
        """Get purchase order by ID."""
        return self.purchase_repo.get_by_id(order_id)
    
    def get_supplier_orders(self, supplier_id: int, skip: int = 0, limit: int = 100) -> List[Purchase]:
        """Get all orders for a supplier."""
        return self.purchase_repo.get_by_supplier(supplier_id, skip, limit)
    
    def get_orders_by_status(self, status: str, skip: int = 0, limit: int = 100) -> List[Purchase]:
        """Get orders by status."""
        return self.purchase_repo.get_by_status(status, skip, limit)
    
    def receive_purchase_order(self, order_id: int) -> Optional[Purchase]:
        """
        Receive purchase order and add stock.
        
        Args:
            order_id: Order ID
            
        Returns:
            Updated order
            
        Raises:
            ValueError: If order not found or invalid status
        """
        order = self.purchase_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        
        if order.status != OrderStatus.DRAFT.value:
            raise ValueError(f"Order cannot be received from {order.status} status")
        
        # Add stock and create transactions
        for item in order.items:
            product = self.product_repo.get_by_id(item.product_id)
            product.stock_quantity += item.quantity
            self.db.add(product)
            
            # Create stock transaction
            transaction = StockTransaction(
                product_id=item.product_id,
                type=StockTransactionType.IN.value,
                quantity=item.quantity,
                reference_type=StockReferenceType.PURCHASE.value,
                reference_id=order_id,
                notes=f"Purchase Order #{order_id} from {order.supplier.name}"
            )
            self.db.add(transaction)
        
        # Update order status
        order.status = OrderStatus.RECEIVED.value
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        
        return order
    
    def cancel_purchase_order(self, order_id: int) -> Optional[Purchase]:
        """
        Cancel purchase order.
        If stock was added, deduct it.
        """
        order = self.purchase_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        
        if order.status == OrderStatus.CANCELLED.value:
            raise ValueError("Order is already cancelled")
        
        # If order was received, deduct stock
        if order.status == OrderStatus.RECEIVED.value:
            for item in order.items:
                product = self.product_repo.get_by_id(item.product_id)
                product.stock_quantity -= item.quantity
                
                # Prevent negative stock
                if product.stock_quantity < 0:
                    product.stock_quantity = 0
                
                self.db.add(product)
                
                # Create adjustment transaction
                transaction = StockTransaction(
                    product_id=item.product_id,
                    type=StockTransactionType.OUT.value,
                    quantity=-item.quantity,
                    reference_type=StockReferenceType.PURCHASE.value,
                    reference_id=order_id,
                    notes=f"Purchase Order #{order_id} Cancelled - Stock Deducted"
                )
                self.db.add(transaction)
        
        order.status = OrderStatus.CANCELLED.value
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        
        return order
    
    def update_order_costs(self, order_id: int, tax_amount: Decimal, discount_amount: Decimal) -> Optional[Purchase]:
        """Update tax and discount amounts for a draft order."""
        order = self.purchase_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")
        
        if order.status != OrderStatus.DRAFT.value:
            raise ValueError("Can only update costs for draft orders")
        
        order.tax_amount = tax_amount
        order.discount_amount = discount_amount
        order.total_amount = order.subtotal + tax_amount - discount_amount
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        
        return order
