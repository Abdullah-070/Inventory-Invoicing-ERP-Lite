"""
Tests for SalesOrderService
"""
import pytest
from datetime import datetime
from sqlalchemy.orm import Session
from decimal import Decimal

from app.services.sales_order_service import SalesOrderService
from app.services.product_service import ProductService
from app.services.customer_service import CustomerService
from app.models import SalesOrder, SalesOrderItem
from app.core.database import Base, engine


@pytest.fixture
def setup_db():
    """Create and drop tables"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(setup_db):
    """Get database session"""
    from app.core.database import SessionLocal
    db = SessionLocal()
    yield db
    db.close()


@pytest.fixture
def sales_order_service(db_session):
    """Create sales order service instance"""
    return SalesOrderService(db_session)


@pytest.fixture
def product_service(db_session):
    """Create product service instance"""
    return ProductService(db_session)


@pytest.fixture
def customer_service(db_session):
    """Create customer service instance"""
    return CustomerService(db_session)


def test_sales_order_creation(sales_order_service, customer_service, product_service):
    """Test creating a sales order"""
    # Create customer
    customer = customer_service.create(
        name="John Doe",
        email="john@example.com",
        phone="555-1234",
        address="123 Main St"
    )
    
    # Create product
    product = product_service.create(
        sku="SKU001",
        name="Widget",
        cost_price=Decimal("10.00"),
        selling_price=Decimal("15.00")
    )
    product_service.adjust_stock(product.id, 100)
    
    # Create sales order
    order = sales_order_service.create(
        customer_id=customer.id,
        items=[{
            "product_id": product.id,
            "quantity": 5,
            "unit_price": Decimal("15.00")
        }]
    )
    
    assert order.id is not None
    assert order.customer_id == customer.id
    assert len(order.items) == 1
    assert order.status == "DRAFT"


def test_sales_order_confirmation(sales_order_service, customer_service, product_service):
    """Test confirming a sales order"""
    # Setup
    customer = customer_service.create(
        name="John Doe",
        email="john@example.com",
        phone="555-1234",
        address="123 Main St"
    )
    product = product_service.create(
        sku="SKU001",
        name="Widget",
        cost_price=Decimal("10.00"),
        selling_price=Decimal("15.00")
    )
    product_service.adjust_stock(product.id, 100)
    
    # Create and confirm order
    order = sales_order_service.create(
        customer_id=customer.id,
        items=[{
            "product_id": product.id,
            "quantity": 5,
            "unit_price": Decimal("15.00")
        }]
    )
    
    confirmed = sales_order_service.confirm(order.id)
    assert confirmed.status == "CONFIRMED"
    
    # Verify stock was deducted
    updated_product = product_service.get(product.id)
    assert updated_product.stock == 95


def test_sales_order_cancellation(sales_order_service, customer_service, product_service):
    """Test cancelling a sales order"""
    # Setup
    customer = customer_service.create(
        name="John Doe",
        email="john@example.com",
        phone="555-1234",
        address="123 Main St"
    )
    product = product_service.create(
        sku="SKU001",
        name="Widget",
        cost_price=Decimal("10.00"),
        selling_price=Decimal("15.00")
    )
    product_service.adjust_stock(product.id, 100)
    
    # Create, confirm, then cancel
    order = sales_order_service.create(
        customer_id=customer.id,
        items=[{
            "product_id": product.id,
            "quantity": 5,
            "unit_price": Decimal("15.00")
        }]
    )
    sales_order_service.confirm(order.id)
    cancelled = sales_order_service.cancel(order.id)
    
    assert cancelled.status == "CANCELLED"
    
    # Verify stock was restored
    updated_product = product_service.get(product.id)
    assert updated_product.stock == 100


def test_sales_order_not_found(sales_order_service):
    """Test getting non-existent order"""
    order = sales_order_service.get(999)
    assert order is None


def test_get_customer_orders(sales_order_service, customer_service, product_service):
    """Test retrieving all orders for a customer"""
    customer = customer_service.create(
        name="John Doe",
        email="john@example.com",
        phone="555-1234",
        address="123 Main St"
    )
    product = product_service.create(
        sku="SKU001",
        name="Widget",
        cost_price=Decimal("10.00"),
        selling_price=Decimal("15.00")
    )
    product_service.adjust_stock(product.id, 100)
    
    # Create multiple orders
    for i in range(3):
        sales_order_service.create(
            customer_id=customer.id,
            items=[{
                "product_id": product.id,
                "quantity": 1,
                "unit_price": Decimal("15.00")
            }]
        )
    
    orders = sales_order_service.get_customer_orders(customer.id)
    assert len(orders) == 3


def test_sales_order_insufficient_stock(sales_order_service, customer_service, product_service):
    """Test order fails when stock insufficient"""
    customer = customer_service.create(
        name="John Doe",
        email="john@example.com",
        phone="555-1234",
        address="123 Main St"
    )
    product = product_service.create(
        sku="SKU001",
        name="Widget",
        cost_price=Decimal("10.00"),
        selling_price=Decimal("15.00")
    )
    product_service.adjust_stock(product.id, 5)
    
    # Try to create order with more than available stock
    with pytest.raises(ValueError):
        sales_order_service.create(
            customer_id=customer.id,
            items=[{
                "product_id": product.id,
                "quantity": 10,
                "unit_price": Decimal("15.00")
            }]
        )
