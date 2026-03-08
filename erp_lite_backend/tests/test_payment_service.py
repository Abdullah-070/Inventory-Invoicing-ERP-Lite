"""Tests for PaymentService."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models import Customer, Supplier, Payment
from app.services.payment_service import PaymentService

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestSession()
    yield session
    session.close()


@pytest.fixture
def customer(db):
    c = Customer(name="Acme Corp", email="acme@example.com")
    db.add(c)
    db.commit()
    return c


@pytest.fixture
def supplier(db):
    s = Supplier(name="Parts Inc", email="parts@example.com")
    db.add(s)
    db.commit()
    return s


def test_record_customer_payment(db, customer):
    svc = PaymentService(db)
    payment = svc.record_payment("CUSTOMER", customer.id, 150.00, "CASH", "Initial payment")
    assert payment.amount == 150.00
    assert payment.customer_id == customer.id


def test_record_supplier_payment(db, supplier):
    svc = PaymentService(db)
    payment = svc.record_payment("SUPPLIER", supplier.id, 500.00, "BANK", "Invoice #123")
    assert payment.amount == 500.00
    assert payment.supplier_id == supplier.id


def test_invalid_entity_type(db):
    svc = PaymentService(db)
    with pytest.raises(ValueError, match="entity_type must be"):
        svc.record_payment("UNKNOWN", 1, 100.00, "CASH")


def test_customer_not_found(db):
    svc = PaymentService(db)
    with pytest.raises(ValueError, match="Customer not found"):
        svc.record_payment("CUSTOMER", 9999, 100.00, "CASH")


def test_get_customer_payments(db, customer):
    svc = PaymentService(db)
    svc.record_payment("CUSTOMER", customer.id, 100.00, "CASH")
    svc.record_payment("CUSTOMER", customer.id, 200.00, "BANK")
    payments = svc.get_customer_payments(customer.id)
    assert len(payments) == 2


def test_customer_balance(db, customer):
    svc = PaymentService(db)
    svc.record_payment("CUSTOMER", customer.id, 100.00, "CASH")
    balance = svc.calculate_customer_balance(customer.id)
    assert balance["total_paid"] == 100.0
