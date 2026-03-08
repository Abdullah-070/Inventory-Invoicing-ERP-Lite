"""Tests for InventoryService."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models import Product, Category, StockTransaction
from app.services.inventory_service import InventoryService

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
def seed(db):
    cat = Category(name="General", description="Default")
    db.add(cat)
    db.flush()
    prod = Product(
        sku="TST-001", name="Test Widget", category_id=cat.id,
        cost_price=10.00, selling_price=20.00, stock_quantity=50, reorder_level=10,
    )
    db.add(prod)
    db.commit()
    return prod


def test_add_stock(db, seed):
    svc = InventoryService(db)
    updated = svc.add_stock(seed.id, 20, notes="Restock")
    assert updated.stock_quantity == 70


def test_remove_stock(db, seed):
    svc = InventoryService(db)
    updated = svc.remove_stock(seed.id, 10, notes="Sold")
    assert updated.stock_quantity == 40


def test_remove_stock_insufficient(db, seed):
    svc = InventoryService(db)
    with pytest.raises(ValueError, match="Insufficient stock"):
        svc.remove_stock(seed.id, 999)


def test_record_adjustment_positive(db, seed):
    svc = InventoryService(db)
    updated = svc.record_adjustment(seed.id, 5, notes="Found extra")
    assert updated.stock_quantity == 55


def test_record_adjustment_negative(db, seed):
    svc = InventoryService(db)
    updated = svc.record_adjustment(seed.id, -5, notes="Damaged")
    assert updated.stock_quantity == 45


def test_record_adjustment_goes_negative(db, seed):
    svc = InventoryService(db)
    with pytest.raises(ValueError, match="cannot go negative"):
        svc.record_adjustment(seed.id, -999)


def test_stock_history(db, seed):
    svc = InventoryService(db)
    svc.add_stock(seed.id, 10)
    svc.remove_stock(seed.id, 5)
    history = svc.get_stock_history(seed.id)
    assert len(history) == 2


def test_inventory_value(db, seed):
    svc = InventoryService(db)
    val = svc.calculate_inventory_value()
    assert val["total_items"] == 50
    assert val["total_cost_value"] == 500.0
