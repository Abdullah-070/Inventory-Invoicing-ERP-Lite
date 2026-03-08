"""
Service layer - business logic for customers.
"""
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models import Customer
from app.repositories import CustomerRepository
from app.schemas import CustomerCreate, CustomerUpdate


class CustomerService:
    """Customer management service."""
    
    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db
        self.customer_repo = CustomerRepository(db, Customer)
    
    def create_customer(self, customer_data: CustomerCreate) -> Customer:
        """
        Create a new customer.
        
        Args:
            customer_data: Customer creation data
            
        Returns:
            Created customer
            
        Raises:
            ValueError: If email already exists
        """
        if customer_data.email and self.customer_repo.get_by_email(customer_data.email):
            raise ValueError("Email already registered")
        
        customer = Customer(**customer_data.dict())
        self.db.add(customer)
        self.db.commit()
        self.db.refresh(customer)
        return customer
    
    def get_customer(self, customer_id: int) -> Optional[Customer]:
        """Get customer by ID."""
        return self.customer_repo.get_by_id(customer_id)
    
    def get_all_customers(self, skip: int = 0, limit: int = 100) -> List[Customer]:
        """Get all customers with pagination."""
        return self.customer_repo.get_all(skip, limit)
    
    def search_customers(self, search_term: str, skip: int = 0, limit: int = 100) -> List[Customer]:
        """Search customers by name."""
        return self.customer_repo.search_by_name(search_term, skip, limit)
    
    def update_customer(self, customer_id: int, customer_data: CustomerUpdate) -> Optional[Customer]:
        """Update customer."""
        customer = self.customer_repo.get_by_id(customer_id)
        if not customer:
            return None
        
        # Check if changing email (must be unique)
        if customer_data.email and customer_data.email != customer.email:
            if self.customer_repo.get_by_email(customer_data.email):
                raise ValueError("Email already registered")
        
        return self.customer_repo.update(customer_id, customer_data)
    
    def delete_customer(self, customer_id: int) -> bool:
        """Delete customer."""
        return self.customer_repo.delete(customer_id)
    
    def get_customer_by_email(self, email: str) -> Optional[Customer]:
        """Get customer by email."""
        return self.customer_repo.get_by_email(email)
