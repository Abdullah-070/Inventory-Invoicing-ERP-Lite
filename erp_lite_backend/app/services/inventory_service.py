"""
Service layer - business logic for inventory management.
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models import (
    Product, StockTransaction, StockTransactionType, StockReferenceType
)
from app.repositories import ProductRepository, BaseRepository


class InventoryService:
    """Inventory and stock management service."""

    def __init__(self, db: Session):
        self.db = db
        self.product_repo = ProductRepository(db, Product)
        self.stock_repo = BaseRepository(db, StockTransaction)

    # ---------- stock movements ----------

    def add_stock(self, product_id: int, quantity: int, reference_type: str = "MANUAL",
                  reference_id: int = None, notes: str = None) -> Product:
        """Add stock to a product and record the transaction."""
        product = self.product_repo.get_by_id(product_id)
        if not product:
            raise ValueError("Product not found")
        if quantity <= 0:
            raise ValueError("Quantity must be positive")

        product.stock_quantity += quantity
        self.db.add(product)

        txn = StockTransaction(
            product_id=product_id,
            type=StockTransactionType.IN.value,
            quantity=quantity,
            reference_type=reference_type,
            reference_id=reference_id,
            notes=notes or "Stock added",
        )
        self.db.add(txn)
        self.db.commit()
        self.db.refresh(product)
        return product

    def remove_stock(self, product_id: int, quantity: int, reference_type: str = "MANUAL",
                     reference_id: int = None, notes: str = None) -> Product:
        """Remove stock from a product and record the transaction."""
        product = self.product_repo.get_by_id(product_id)
        if not product:
            raise ValueError("Product not found")
        if quantity <= 0:
            raise ValueError("Quantity must be positive")
        if product.stock_quantity < quantity:
            raise ValueError("Insufficient stock")

        product.stock_quantity -= quantity
        self.db.add(product)

        txn = StockTransaction(
            product_id=product_id,
            type=StockTransactionType.OUT.value,
            quantity=-quantity,
            reference_type=reference_type,
            reference_id=reference_id,
            notes=notes or "Stock removed",
        )
        self.db.add(txn)
        self.db.commit()
        self.db.refresh(product)
        return product

    def record_adjustment(self, product_id: int, quantity: int, notes: str = None) -> Product:
        """Record a manual stock adjustment (positive or negative)."""
        product = self.product_repo.get_by_id(product_id)
        if not product:
            raise ValueError("Product not found")

        new_qty = product.stock_quantity + quantity
        if new_qty < 0:
            raise ValueError("Stock cannot go negative")

        product.stock_quantity = new_qty
        self.db.add(product)

        txn = StockTransaction(
            product_id=product_id,
            type=StockTransactionType.ADJUSTMENT.value,
            quantity=quantity,
            reference_type=StockReferenceType.MANUAL.value,
            notes=notes or "Manual adjustment",
        )
        self.db.add(txn)
        self.db.commit()
        self.db.refresh(product)
        return product

    # ---------- queries ----------

    def get_stock_history(self, product_id: int, skip: int = 0, limit: int = 100) -> List[StockTransaction]:
        """Get stock transaction history for a product."""
        return (
            self.db.query(StockTransaction)
            .filter(StockTransaction.product_id == product_id)
            .order_by(StockTransaction.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_all_transactions(self, skip: int = 0, limit: int = 100) -> List[StockTransaction]:
        """Get all stock transactions."""
        return (
            self.db.query(StockTransaction)
            .order_by(StockTransaction.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_low_stock_products(self) -> List[Product]:
        """Get products where stock_quantity <= reorder_level."""
        return self.product_repo.get_low_stock()

    def get_out_of_stock_products(self) -> List[Product]:
        """Get products with zero stock."""
        return (
            self.db.query(Product)
            .filter(Product.stock_quantity == 0, Product.is_active == True)
            .all()
        )

    def calculate_inventory_value(self) -> dict:
        """Calculate total inventory value at cost price."""
        products = self.db.query(Product).filter(Product.is_active == True).all()
        total_items = sum(p.stock_quantity for p in products)
        total_cost_value = sum(p.stock_quantity * float(p.cost_price) for p in products)
        total_retail_value = sum(p.stock_quantity * float(p.selling_price) for p in products)
        return {
            "total_products": len(products),
            "total_items": total_items,
            "total_cost_value": round(total_cost_value, 2),
            "total_retail_value": round(total_retail_value, 2),
        }
