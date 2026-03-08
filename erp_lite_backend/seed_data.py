"""
Seed script — populates the database with realistic sample data for testing.
Run:  python seed_data.py          (from erp_lite_backend/)
Or:   .\venv\Scripts\python.exe seed_data.py
"""
import sys, os, random
from datetime import datetime, timedelta
from decimal import Decimal

# Ensure app package is importable
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal, engine, Base
from app.models import (
    User, UserRole, Category, Product, Customer, Supplier,
    SalesOrder, SalesOrderItem, Purchase, PurchaseItem,
    Payment, StockTransaction,
)
from app.core.security import hash_password

# ─── helpers ──────────────────────────────────────────────────────
rand = random.Random(42)  # deterministic seed

def rdate(start_days_ago: int = 90) -> datetime:
    """Random datetime within the last N days."""
    return datetime.utcnow() - timedelta(
        days=rand.randint(0, start_days_ago),
        hours=rand.randint(0, 23),
        minutes=rand.randint(0, 59),
    )

# ─── data definitions ────────────────────────────────────────────
CATEGORIES = [
    ("Electronics", "Computers, phones, accessories"),
    ("Office Supplies", "Paper, pens, desk accessories"),
    ("Furniture", "Desks, chairs, shelves"),
    ("Cleaning Supplies", "Detergents, brushes, mops"),
    ("Packaging", "Boxes, tape, bubble wrap"),
]

PRODUCTS = [
    # (sku, name, cat_idx, cost, sell, stock, reorder)
    ("ELC-001", "Wireless Mouse",            0, 8.50,  14.99, 120, 20),
    ("ELC-002", "USB-C Hub 7-in-1",          0, 15.00, 29.99,  45, 10),
    ("ELC-003", "Bluetooth Keyboard",        0, 18.00, 34.99,  60, 15),
    ("ELC-004", "27\" LED Monitor",          0, 140.00,249.99, 12,  5),
    ("ELC-005", "Webcam 1080p",              0, 22.00, 39.99,  35, 10),
    ("OFF-001", "A4 Paper Ream (500 sheets)",1, 3.20,   5.99, 200, 50),
    ("OFF-002", "Ballpoint Pens (12-pack)",  1, 1.80,   4.49, 300, 60),
    ("OFF-003", "Sticky Notes Pack",         1, 1.20,   2.99, 180, 40),
    ("OFF-004", "Whiteboard Markers (set)",  1, 4.00,   8.99,  70, 15),
    ("OFF-005", "Desktop Calculator",        1, 6.50,  12.99,  55, 10),
    ("FRN-001", "Ergonomic Office Chair",    2, 95.00, 179.99, 18,  5),
    ("FRN-002", "Standing Desk 120cm",       2, 210.00,399.99,  8,  3),
    ("FRN-003", "3-Shelf Bookcase",          2, 40.00, 79.99,  22,  5),
    ("CLN-001", "All-Purpose Cleaner 5L",    3, 5.00,   9.99,  90, 20),
    ("CLN-002", "Microfiber Cloths (10-pk)", 3, 3.50,   7.49, 110, 25),
    ("PKG-001", "Shipping Box Medium",       4, 0.80,   1.99, 500, 100),
    ("PKG-002", "Bubble Wrap Roll 50m",      4, 6.00,  11.99,  40, 10),
    ("PKG-003", "Packing Tape (6-roll)",     4, 4.50,   8.99,  65, 15),
]

CUSTOMERS = [
    ("RetailMax Corp",    "orders@retailmax.com",    "+1-555-0101", "45 Commerce Blvd, Chicago"),
    ("UrbanMart LLC",     "supply@urbanmart.com",    "+1-555-0102", "12 Market St, New York"),
    ("QuickShip Supplies","info@quickship.co",       "+1-555-0103", "88 Warehouse Ave, Dallas"),
    ("BrightOffice Inc",  "purchase@brightoffice.io", "+1-555-0104", "330 Tower Ln, San Francisco"),
    ("GreenClean Co",     "hello@greenclean.com",    "+1-555-0105", "7 Eco Park, Portland"),
]

SUPPLIERS = [
    ("TechSource Ltd",    "sales@techsource.com",     "+1-555-0201", "1 Innovation Dr, Shenzhen"),
    ("PaperWorld Inc",    "orders@paperworld.com",     "+1-555-0202", "50 Mill Rd, Memphis"),
    ("FurniPro Mfg",      "wholesale@furnipro.com",    "+1-555-0203", "22 Factory Way, Grand Rapids"),
    ("CleanBulk Supplies","bulk@cleanbulk.com",        "+1-555-0204", "8 Industrial Park, Houston"),
    ("PackRight Co",      "hello@packright.com",       "+1-555-0205", "100 Box Ln, Louisville"),
]


def seed():
    db = SessionLocal()
    try:
        # ── 1. Categories ────────────────────────────────────
        existing_cats = db.query(Category).count()
        if existing_cats > 0:
            print(f"Database already has {existing_cats} categories. Skipping seed.")
            print("To re-seed, delete  data/erp_lite.db  and restart the backend first.")
            return

        cats = []
        for name, desc in CATEGORIES:
            c = Category(name=name, description=desc)
            db.add(c); cats.append(c)
        db.flush()  # get IDs
        print(f"  ✓ {len(cats)} categories")

        # ── 2. Products ──────────────────────────────────────
        prods = []
        for sku, name, cat_idx, cost, sell, stock, reorder in PRODUCTS:
            p = Product(
                sku=sku, name=name, category_id=cats[cat_idx].id,
                cost_price=Decimal(str(cost)), selling_price=Decimal(str(sell)),
                stock_quantity=stock, reorder_level=reorder,
            )
            db.add(p); prods.append(p)
        db.flush()
        print(f"  ✓ {len(prods)} products")

        # Stock-in transactions for initial inventory
        for p in prods:
            db.add(StockTransaction(
                product_id=p.id, type="IN", quantity=p.stock_quantity,
                reference_type="MANUAL", notes="Initial inventory seed",
            ))

        # ── 3. Customers ─────────────────────────────────────
        custs = []
        for name, email, phone, addr in CUSTOMERS:
            c = Customer(name=name, email=email, phone=phone, address=addr)
            db.add(c); custs.append(c)
        db.flush()
        print(f"  ✓ {len(custs)} customers")

        # ── 4. Customer user accounts ────────────────────────
        for cust in custs:
            uname = cust.name.lower().replace(" ", "_").replace(".", "")
            existing = db.query(User).filter(User.username == uname).first()
            if not existing:
                db.add(User(
                    username=uname, email=cust.email,
                    hashed_password=hash_password("password123"),
                    role=UserRole.CUSTOMER.value, is_active=True,
                ))
        db.flush()
        print(f"  ✓ customer user accounts")

        # ── 5. Suppliers ─────────────────────────────────────
        supps = []
        for name, email, phone, addr in SUPPLIERS:
            s = Supplier(name=name, email=email, phone=phone, address=addr)
            db.add(s); supps.append(s)
        db.flush()
        print(f"  ✓ {len(supps)} suppliers")

        # ── 6. Purchase Orders (received → stock in) ─────────
        purchase_count = 0
        for _ in range(8):
            supp = rand.choice(supps)
            po = Purchase(supplier_id=supp.id, status="RECEIVED",
                          total_cost=Decimal("0"), created_at=rdate(60))
            db.add(po); db.flush()

            total = Decimal("0")
            chosen = rand.sample(prods, k=rand.randint(1, 4))
            for prod in chosen:
                qty = rand.randint(10, 50)
                uc = prod.cost_price
                sub = uc * qty
                total += sub
                db.add(PurchaseItem(
                    purchase_id=po.id, product_id=prod.id,
                    quantity=qty, unit_cost=uc, subtotal=sub,
                ))
                # stock in
                prod.stock_quantity += qty
                db.add(StockTransaction(
                    product_id=prod.id, type="IN", quantity=qty,
                    reference_type="PURCHASE", reference_id=po.id,
                    notes=f"Purchase #{po.id} received",
                    created_at=po.created_at,
                ))
            po.total_cost = total
            purchase_count += 1
        db.flush()
        print(f"  ✓ {purchase_count} purchase orders (received)")

        # ── 7. Sales Orders ──────────────────────────────────
        sales_count = 0
        for i in range(12):
            cust = rand.choice(custs)
            status = rand.choice(["CONFIRMED", "CONFIRMED", "PAID", "PAID", "PAID"])
            so = SalesOrder(
                customer_id=cust.id, status=status,
                invoice_number=f"INV-2026-{1000 + i}",
                subtotal=Decimal("0"), tax_amount=Decimal("0"),
                discount_amount=Decimal("0"), total_amount=Decimal("0"),
                created_at=rdate(45),
            )
            db.add(so); db.flush()

            subtotal = Decimal("0")
            chosen = rand.sample(prods, k=rand.randint(1, 5))
            for prod in chosen:
                qty = rand.randint(1, 10)
                up = prod.selling_price
                sub = up * qty
                subtotal += sub
                db.add(SalesOrderItem(
                    order_id=so.id, product_id=prod.id,
                    quantity=qty, unit_price=up, subtotal=sub,
                ))
                # stock out
                prod.stock_quantity = max(0, prod.stock_quantity - qty)
                db.add(StockTransaction(
                    product_id=prod.id, type="OUT", quantity=qty,
                    reference_type="SALE", reference_id=so.id,
                    notes=f"Sale #{so.id} ({status})",
                    created_at=so.created_at,
                ))
            tax = (subtotal * Decimal("0.08")).quantize(Decimal("0.01"))
            discount = Decimal("0")
            if rand.random() > 0.6:
                discount = (subtotal * Decimal("0.05")).quantize(Decimal("0.01"))
            so.subtotal = subtotal
            so.tax_amount = tax
            so.discount_amount = discount
            so.total_amount = subtotal + tax - discount
            sales_count += 1
        db.flush()
        print(f"  ✓ {sales_count} sales orders")

        # ── 8. Payments ──────────────────────────────────────
        payment_count = 0
        # Customer payments
        for so in db.query(SalesOrder).filter(SalesOrder.status == "PAID").all():
            method = rand.choice(["CASH", "BANK", "ONLINE"])
            db.add(Payment(
                entity_type="CUSTOMER", customer_id=so.customer_id,
                amount=so.total_amount, payment_method=method,
                reference_note=f"Payment for {so.invoice_number}",
                created_at=so.created_at + timedelta(days=rand.randint(0, 3)),
            ))
            payment_count += 1
        # Supplier payments
        for po in db.query(Purchase).filter(Purchase.status == "RECEIVED").all():
            method = rand.choice(["BANK", "ONLINE"])
            db.add(Payment(
                entity_type="SUPPLIER", supplier_id=po.supplier_id,
                amount=po.total_cost, payment_method=method,
                reference_note=f"Payment for PO#{po.id}",
                created_at=po.created_at + timedelta(days=rand.randint(1, 7)),
            ))
            payment_count += 1
        print(f"  ✓ {payment_count} payments")

        db.commit()
        print("\n✅ Seed data inserted successfully!")
        print("   Login as  admin / admin123  to see everything.")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Seeding ERP-Lite database...\n")
    seed()
