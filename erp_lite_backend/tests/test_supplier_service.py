"""
Tests for SupplierService
"""
import pytest
from sqlalchemy.orm import Session

from app.services.supplier_service import SupplierService
from app.models import Supplier
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
def supplier_service(db_session):
    """Create supplier service instance"""
    return SupplierService(db_session)


def test_supplier_creation(supplier_service):
    """Test creating a supplier"""
    supplier = supplier_service.create(
        name="ACME Corp",
        email="contact@acme.com",
        phone="555-9999",
        address="789 Factory Rd"
    )
    assert supplier.id is not None
    assert supplier.name == "ACME Corp"
    assert supplier.email == "contact@acme.com"


def test_supplier_not_found(supplier_service):
    """Test getting non-existent supplier"""
    supplier = supplier_service.get(999)
    assert supplier is None


def test_get_all_suppliers(supplier_service):
    """Test retrieving all suppliers"""
    supplier_service.create(
        name="ACME Corp",
        email="acme@example.com",
        phone="555-9999",
        address="789 Factory Rd"
    )
    supplier_service.create(
        name="Global Parts",
        email="global@example.com",
        phone="555-8888",
        address="321 Industrial Ave"
    )
    suppliers = supplier_service.get_all()
    assert len(suppliers) == 2


def test_update_supplier(supplier_service):
    """Test updating a supplier"""
    supplier = supplier_service.create(
        name="ACME Corp",
        email="contact@acme.com",
        phone="555-9999",
        address="789 Factory Rd"
    )
    updated = supplier_service.update(
        supplier.id,
        name="ACME Industries",
        phone="555-0000"
    )
    assert updated.name == "ACME Industries"
    assert updated.phone == "555-0000"


def test_delete_supplier(supplier_service):
    """Test deleting a supplier"""
    supplier = supplier_service.create(
        name="ACME Corp",
        email="contact@acme.com",
        phone="555-9999",
        address="789 Factory Rd"
    )
    result = supplier_service.delete(supplier.id)
    assert result is True
    assert supplier_service.get(supplier.id) is None


def test_supplier_email_validation(supplier_service):
    """Test email format validation"""
    with pytest.raises(ValueError):
        supplier_service.create(
            name="ACME",
            email="invalid-email",
            phone="555-9999",
            address="789 Factory Rd"
        )


def test_duplicate_supplier_email(supplier_service):
    """Test that duplicate email raises error"""
    supplier_service.create(
        name="ACME Corp",
        email="contact@acme.com",
        phone="555-9999",
        address="789 Factory Rd"
    )
    with pytest.raises(ValueError):
        supplier_service.create(
            name="ACME Industries",
            email="contact@acme.com",
            phone="555-0000",
            address="321 Industrial Ave"
        )
