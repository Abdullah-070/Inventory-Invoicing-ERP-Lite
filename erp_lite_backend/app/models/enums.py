"""
Shared enums for all models. Kept separate to avoid circular imports.
"""
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"
    VIEWER = "VIEWER"
    CUSTOMER = "CUSTOMER"


class StockTransactionType(str, Enum):
    IN = "IN"
    OUT = "OUT"
    ADJUSTMENT = "ADJUSTMENT"


class StockReferenceType(str, Enum):
    SALE = "SALE"
    PURCHASE = "PURCHASE"
    MANUAL = "MANUAL"


class OrderStatus(str, Enum):
    DRAFT = "DRAFT"
    CONFIRMED = "CONFIRMED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


class PurchaseStatus(str, Enum):
    DRAFT = "DRAFT"
    RECEIVED = "RECEIVED"
    CANCELLED = "CANCELLED"


class PaymentMethod(str, Enum):
    CASH = "CASH"
    BANK = "BANK"
    ONLINE = "ONLINE"


class EntityType(str, Enum):
    CUSTOMER = "CUSTOMER"
    SUPPLIER = "SUPPLIER"
