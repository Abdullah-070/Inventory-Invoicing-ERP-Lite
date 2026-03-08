"""
Unit tests for product service
"""
import pytest
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models import Product, Category
from app.services import ProductService
from app.schemas import ProductCreate, ProductUpdate
from app.core.database import Base, engine


@pytest.fixture
def setup_db():
    """Setup test database"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_product_creation(db_session: Session, setup_db):
    """Test creating a new product"""
    # First create a category
    category = Category(name="Electronics", description="Electronic products")
    db_session.add(category)
    db_session.commit()
    
    # Create product
    service = ProductService(db_session)
    product_data = ProductCreate(
        sku="PROD001",
        name="Test Product",
        category_id=category.id,
        cost_price=Decimal("10.00"),
        selling_price=Decimal("15.00"),
        reorder_level=5
    )
    
    product = service.create_product(product_data)
    
    assert product.id is not None
    assert product.sku == "PROD001"
    assert product.name == "Test Product"
    assert product.stock_quantity == 0


def test_product_not_found(db_session: Session, setup_db):
    """Test getting non-existent product"""
    service = ProductService(db_session)
    product = service.get_product(999)
    assert product is None


def test_duplicate_sku(db_session: Session, setup_db):
    """Test that duplicate SKU is rejected"""
    category = Category(name="Electronics")
    db_session.add(category)
    db_session.commit()
    
    service = ProductService(db_session)
    product_data = ProductCreate(
        sku="PROD001",
        name="Product 1",
        category_id=category.id,
        cost_price=Decimal("10.00"),
        selling_price=Decimal("15.00"),
        reorder_level=5
    )
    
    service.create_product(product_data)
    
    # Try to create another with same SKU
    with pytest.raises(ValueError, match="SKU already exists"):
        service.create_product(product_data)
