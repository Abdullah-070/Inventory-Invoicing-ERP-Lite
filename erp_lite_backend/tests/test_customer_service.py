"""
Tests for CustomerService
"""
import pytest
from sqlalchemy.orm import Session

from app.services.customer_service import CustomerService
from app.models import Customer
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
def customer_service(db_session):
    """Create customer service instance"""
    return CustomerService(db_session)


def test_customer_creation(customer_service):
    """Test creating a customer"""
    customer = customer_service.create(
        name="John Doe",
        email="john@example.com",
        phone="555-1234",
        address="123 Main St"
    )
    assert customer.id is not None
    assert customer.name == "John Doe"
    assert customer.email == "john@example.com"


def test_customer_not_found(customer_service):
    """Test getting non-existent customer"""
    customer = customer_service.get(999)
    assert customer is None


def test_get_all_customers(customer_service):
    """Test retrieving all customers"""
    customer_service.create(
        name="John",
        email="john@example.com",
        phone="555-1234",
        address="123 Main St"
    )
    customer_service.create(
        name="Jane",
        email="jane@example.com",
        phone="555-5678",
        address="456 Oak Ave"
    )
    customers = customer_service.get_all()
    assert len(customers) == 2


def test_update_customer(customer_service):
    """Test updating a customer"""
    customer = customer_service.create(
        name="John Doe",
        email="john@example.com",
        phone="555-1234",
        address="123 Main St"
    )
    updated = customer_service.update(
        customer.id,
        name="Jane Doe",
        email="jane@example.com"
    )
    assert updated.name == "Jane Doe"
    assert updated.email == "jane@example.com"


def test_delete_customer(customer_service):
    """Test deleting a customer"""
    customer = customer_service.create(
        name="John Doe",
        email="john@example.com",
        phone="555-1234",
        address="123 Main St"
    )
    result = customer_service.delete(customer.id)
    assert result is True
    assert customer_service.get(customer.id) is None


def test_customer_email_validation(customer_service):
    """Test email format validation"""
    # Invalid email should raise ValueError
    with pytest.raises(ValueError):
        customer_service.create(
            name="John",
            email="invalid-email",
            phone="555-1234",
            address="123 Main St"
        )


def test_duplicate_customer_email(customer_service):
    """Test that duplicate email raises error"""
    customer_service.create(
        name="John",
        email="john@example.com",
        phone="555-1234",
        address="123 Main St"
    )
    with pytest.raises(ValueError):
        customer_service.create(
            name="Jane",
            email="john@example.com",
            phone="555-5678",
            address="456 Oak Ave"
        )
