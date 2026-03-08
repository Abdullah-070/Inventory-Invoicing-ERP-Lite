"""
Repository pattern - data access layer.
"""
from typing import Optional, List, Generic, TypeVar
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from app.core.database import Base

T = TypeVar('T', bound=Base)


class BaseRepository(Generic[T]):
    """Base repository for common CRUD operations."""
    
    def __init__(self, db: Session, model: type[T]):
        """
        Initialize repository.
        
        Args:
            db: Database session
            model: SQLAlchemy model class
        """
        self.db = db
        self.model = model
    
    def create(self, obj_in) -> T:
        """Create a new record."""
        db_obj = self.model(**obj_in.dict(exclude_unset=True))
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def get_by_id(self, id: int) -> Optional[T]:
        """Get record by ID."""
        return self.db.query(self.model).filter(self.model.id == id).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """Get all records with pagination."""
        return self.db.query(self.model).offset(skip).limit(limit).all()
    
    def update(self, id: int, obj_in) -> Optional[T]:
        """Update a record."""
        db_obj = self.get_by_id(id)
        if not db_obj:
            return None
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def delete(self, id: int) -> bool:
        """Delete a record."""
        db_obj = self.get_by_id(id)
        if not db_obj:
            return False
        self.db.delete(db_obj)
        self.db.commit()
        return True
    
    def count(self) -> int:
        """Count total records."""
        return self.db.query(self.model).count()


class UserRepository(BaseRepository):
    """User repository for user-specific queries."""
    
    def get_by_username(self, username: str):
        """Get user by username."""
        return self.db.query(self.model).filter(self.model.username == username).first()
    
    def get_by_email(self, email: str):
        """Get user by email."""
        return self.db.query(self.model).filter(self.model.email == email).first()
    
    def get_active_users(self):
        """Get all active users."""
        return self.db.query(self.model).filter(self.model.is_active == True).all()


class ProductRepository(BaseRepository):
    """Product repository for product-specific queries."""
    
    def get_by_sku(self, sku: str):
        """Get product by SKU."""
        return self.db.query(self.model).filter(self.model.sku == sku).first()
    
    def get_by_barcode(self, barcode: str):
        """Get product by barcode."""
        return self.db.query(self.model).filter(self.model.barcode == barcode).first()
    
    def get_by_category(self, category_id: int, skip: int = 0, limit: int = 100):
        """Get products by category."""
        return self.db.query(self.model).filter(
            self.model.category_id == category_id,
            self.model.is_active == True
        ).offset(skip).limit(limit).all()
    
    def get_low_stock(self):
        """Get products with low stock."""
        return self.db.query(self.model).filter(
            self.model.stock_quantity <= self.model.reorder_level,
            self.model.is_active == True
        ).all()
    
    def get_active_products(self, skip: int = 0, limit: int = 100):
        """Get all active products."""
        return self.db.query(self.model).filter(
            self.model.is_active == True
        ).offset(skip).limit(limit).all()


class CustomerRepository(BaseRepository):
    """Customer repository for customer-specific queries."""
    
    def get_by_email(self, email: str):
        """Get customer by email."""
        return self.db.query(self.model).filter(self.model.email == email).first()
    
    def search_by_name(self, name: str, skip: int = 0, limit: int = 100):
        """Search customers by name."""
        return self.db.query(self.model).filter(
            self.model.name.ilike(f"%{name}%")
        ).offset(skip).limit(limit).all()


class SupplierRepository(BaseRepository):
    """Supplier repository for supplier-specific queries."""
    
    def get_by_email(self, email: str):
        """Get supplier by email."""
        return self.db.query(self.model).filter(self.model.email == email).first()
    
    def search_by_name(self, name: str, skip: int = 0, limit: int = 100):
        """Search suppliers by name."""
        return self.db.query(self.model).filter(
            self.model.name.ilike(f"%{name}%")
        ).offset(skip).limit(limit).all()


class SalesOrderRepository(BaseRepository):
    """Sales order repository."""
    
    def get_by_customer(self, customer_id: int, skip: int = 0, limit: int = 100):
        """Get sales orders by customer."""
        return self.db.query(self.model).filter(
            self.model.customer_id == customer_id
        ).order_by(desc(self.model.created_at)).offset(skip).limit(limit).all()
    
    def get_by_status(self, status: str, skip: int = 0, limit: int = 100):
        """Get sales orders by status. Empty string returns all."""
        query = self.db.query(self.model)
        if status:
            query = query.filter(self.model.status == status)
        return query.order_by(desc(self.model.created_at)).offset(skip).limit(limit).all()
    
    def get_pending_orders(self):
        """Get pending (non-cancelled) orders."""
        return self.db.query(self.model).filter(
            self.model.status != "CANCELLED"
        ).all()


class PurchaseRepository(BaseRepository):
    """Purchase repository."""
    
    def get_by_supplier(self, supplier_id: int, skip: int = 0, limit: int = 100):
        """Get purchases by supplier."""
        return self.db.query(self.model).filter(
            self.model.supplier_id == supplier_id
        ).order_by(desc(self.model.created_at)).offset(skip).limit(limit).all()
    
    def get_by_status(self, status: str, skip: int = 0, limit: int = 100):
        """Get purchases by status. Empty string returns all."""
        query = self.db.query(self.model)
        if status:
            query = query.filter(self.model.status == status)
        return query.order_by(desc(self.model.created_at)).offset(skip).limit(limit).all()


class StockTransactionRepository(BaseRepository):
    """Stock transaction repository."""
    
    def get_by_product(self, product_id: int, skip: int = 0, limit: int = 100):
        """Get stock transactions for a product."""
        return self.db.query(self.model).filter(
            self.model.product_id == product_id
        ).order_by(desc(self.model.created_at)).offset(skip).limit(limit).all()
    
    def get_by_reference(self, reference_type: str, reference_id: int):
        """Get transactions by reference."""
        return self.db.query(self.model).filter(
            self.model.reference_type == reference_type,
            self.model.reference_id == reference_id
        ).all()
