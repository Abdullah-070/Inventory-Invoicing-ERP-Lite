"""
Service layer - business logic for suppliers.
"""
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models import Supplier
from app.repositories import SupplierRepository
from app.schemas import SupplierCreate, SupplierUpdate


class SupplierService:
    """Supplier management service."""
    
    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db
        self.supplier_repo = SupplierRepository(db, Supplier)
    
    def create_supplier(self, supplier_data: SupplierCreate) -> Supplier:
        """
        Create a new supplier.
        
        Args:
            supplier_data: Supplier creation data
            
        Returns:
            Created supplier
            
        Raises:
            ValueError: If email already exists
        """
        if supplier_data.email and self.supplier_repo.get_by_email(supplier_data.email):
            raise ValueError("Email already registered")
        
        supplier = Supplier(**supplier_data.dict())
        self.db.add(supplier)
        self.db.commit()
        self.db.refresh(supplier)
        return supplier
    
    def get_supplier(self, supplier_id: int) -> Optional[Supplier]:
        """Get supplier by ID."""
        return self.supplier_repo.get_by_id(supplier_id)
    
    def get_all_suppliers(self, skip: int = 0, limit: int = 100) -> List[Supplier]:
        """Get all suppliers with pagination."""
        return self.supplier_repo.get_all(skip, limit)
    
    def search_suppliers(self, search_term: str, skip: int = 0, limit: int = 100) -> List[Supplier]:
        """Search suppliers by name."""
        return self.supplier_repo.search_by_name(search_term, skip, limit)
    
    def update_supplier(self, supplier_id: int, supplier_data: SupplierUpdate) -> Optional[Supplier]:
        """Update supplier."""
        supplier = self.supplier_repo.get_by_id(supplier_id)
        if not supplier:
            return None
        
        # Check if changing email (must be unique)
        if supplier_data.email and supplier_data.email != supplier.email:
            if self.supplier_repo.get_by_email(supplier_data.email):
                raise ValueError("Email already registered")
        
        return self.supplier_repo.update(supplier_id, supplier_data)
    
    def delete_supplier(self, supplier_id: int) -> bool:
        """Delete supplier."""
        return self.supplier_repo.delete(supplier_id)
    
    def get_supplier_by_email(self, email: str) -> Optional[Supplier]:
        """Get supplier by email."""
        return self.supplier_repo.get_by_email(email)
