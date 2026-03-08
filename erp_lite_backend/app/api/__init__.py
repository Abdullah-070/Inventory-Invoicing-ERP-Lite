"""API routes package."""

from app.api import auth, products, customers, suppliers, sales, purchases, reports, categories, payments, stock_transactions

__all__ = ["auth", "products", "customers", "suppliers", "sales", "purchases", "reports", "categories", "payments", "stock_transactions"]
