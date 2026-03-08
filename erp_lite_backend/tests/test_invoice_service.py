"""Tests for InvoiceService."""
import pytest
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models import (
    Customer, Category, Product, SalesOrder, SalesOrderItem, OrderStatus,
)
from app.services.invoice_service import InvoiceService

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
def confirmed_order(db):
    """Create a confirmed order ready for invoicing."""
    cat = Category(name="General")
    db.add(cat)
    db.flush()
    prod = Product(
        sku="INV-001", name="Invoice Widget", category_id=cat.id,
        cost_price=5.00, selling_price=15.00, stock_quantity=100, reorder_level=5,
    )
    cust = Customer(name="Test Customer", email="test@example.com")
    db.add_all([prod, cust])
    db.flush()

    order = SalesOrder(
        customer_id=cust.id,
        status=OrderStatus.CONFIRMED.value,
        subtotal=30.00, tax_amount=0, discount_amount=0, total_amount=30.00,
    )
    db.add(order)
    db.flush()

    item = SalesOrderItem(
        order_id=order.id, product_id=prod.id,
        quantity=2, unit_price=15.00, subtotal=30.00,
    )
    db.add(item)
    db.commit()
    return order


def test_generate_invoice_number():
    svc = InvoiceService.__new__(InvoiceService)
    from datetime import datetime
    year = datetime.now().year
    assert svc.generate_invoice_number(1) == f"INV-{year}-1001"
    assert svc.generate_invoice_number(42) == f"INV-{year}-1042"


def test_create_invoice(db, confirmed_order):
    svc = InvoiceService(db)
    updated = svc.create_invoice(confirmed_order.id)
    assert updated.invoice_number is not None
    assert updated.invoice_number.startswith("INV-")


def test_create_invoice_idempotent(db, confirmed_order):
    svc = InvoiceService(db)
    first = svc.create_invoice(confirmed_order.id)
    second = svc.create_invoice(confirmed_order.id)
    assert first.invoice_number == second.invoice_number


def test_calculate_totals(db, confirmed_order):
    svc = InvoiceService(db)
    totals = svc.calculate_totals(confirmed_order.id)
    assert totals["total_amount"] == 30.0


def test_create_invoice_draft_fails(db):
    cat = Category(name="X")
    db.add(cat)
    db.flush()
    cust = Customer(name="C")
    db.add(cust)
    db.flush()
    order = SalesOrder(
        customer_id=cust.id, status=OrderStatus.DRAFT.value,
        subtotal=0, tax_amount=0, discount_amount=0, total_amount=0,
    )
    db.add(order)
    db.commit()

    svc = InvoiceService(db)
    with pytest.raises(ValueError, match="confirmed/paid"):
        svc.create_invoice(order.id)
