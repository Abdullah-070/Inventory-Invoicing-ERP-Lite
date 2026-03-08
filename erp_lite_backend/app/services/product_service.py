"""
Service layer - business logic for products.
"""
from typing import List, Optional
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models import Product, Category, StockTransaction, StockTransactionType, StockReferenceType
from app.repositories import ProductRepository, BaseRepository
from app.schemas import ProductCreate, ProductUpdate


class ProductService:
    """Product management service."""
    
    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db
        self.product_repo = ProductRepository(db, Product)
        self.category_repo = BaseRepository(db, Category)
        self.stock_transaction_repo = BaseRepository(db, StockTransaction)
    
    def create_product(self, product_data: ProductCreate) -> Product:
        """
        Create a new product.
        
        Args:
            product_data: Product creation data
            
        Returns:
            Created product
            
        Raises:
            ValueError: If SKU already exists or category not found
        """
        if self.product_repo.get_by_sku(product_data.sku):
            raise ValueError("SKU already exists")
        
        category = self.category_repo.get_by_id(product_data.category_id)
        if not category:
            raise ValueError("Category not found")
        
        product = Product(**product_data.dict())
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product
    
    def get_product(self, product_id: int) -> Optional[Product]:
        """Get product by ID."""
        return self.product_repo.get_by_id(product_id)
    
    def get_all_products(self, skip: int = 0, limit: int = 100) -> List[Product]:
        """Get all active products."""
        return self.product_repo.get_active_products(skip, limit)
    
    def update_product(self, product_id: int, product_data: ProductUpdate) -> Optional[Product]:
        """Update product."""
        product = self.product_repo.get_by_id(product_id)
        if not product:
            return None
        
        # Check if changing category
        if product_data.category_id and product_data.category_id != product.category_id:
            category = self.category_repo.get_by_id(product_data.category_id)
            if not category:
                raise ValueError("Category not found")
        
        # Check if changing SKU (must be unique)
        if product_data.sku and product_data.sku != product.sku:
            if self.product_repo.get_by_sku(product_data.sku):
                raise ValueError("SKU already exists")
        
        return self.product_repo.update(product_id, product_data)
    
    def delete_product(self, product_id: int) -> bool:
        """Soft delete product by marking as inactive."""
        product = self.product_repo.get_by_id(product_id)
        if not product:
            return False
        
        product.is_active = False
        self.db.add(product)
        self.db.commit()
        return True
    
    def get_low_stock_products(self) -> List[Product]:
        """Get products with low stock."""
        return self.product_repo.get_low_stock()
    
    def adjust_stock(self, product_id: int, quantity: int, notes: str = None) -> Product:
        """
        Manually adjust product stock.
        
        Args:
            product_id: Product ID
            quantity: Quantity to add/remove (positive/negative)
            notes: Optional notes
            
        Returns:
            Updated product
            
        Raises:
            ValueError: If product not found or stock would go negative
        """
        product = self.product_repo.get_by_id(product_id)
        if not product:
            raise ValueError("Product not found")
        
        new_quantity = product.stock_quantity + quantity
        if new_quantity < 0:
            raise ValueError("Stock cannot go negative")
        
        # Update stock
        product.stock_quantity = new_quantity
        self.db.add(product)
        
        # Create stock transaction
        transaction = StockTransaction(
            product_id=product_id,
            type=StockTransactionType.ADJUSTMENT.value,
            quantity=quantity,
            reference_type=StockReferenceType.MANUAL.value,
            notes=notes or "Manual adjustment"
        )
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(product)
        
        return product
    
    def get_stock_history(self, product_id: int, skip: int = 0, limit: int = 100) -> List[StockTransaction]:
        """Get stock transaction history for a product."""
        return self.stock_transaction_repo.get_by_product(product_id, skip, limit)
    
    def get_product_by_sku(self, sku: str) -> Optional[Product]:
        """Get product by SKU."""
        return self.product_repo.get_by_sku(sku)
    
    def calculate_inventory_value(self) -> Decimal:
        """Calculate total inventory valuation."""
        products = self.db.query(Product).filter(Product.is_active == True).all()
        total = Decimal("0")
        for product in products:
            total += product.cost_price * Decimal(str(product.stock_quantity))
        return total
