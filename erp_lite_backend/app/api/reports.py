"""
API endpoints for reports and analytics.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.services import ReportService

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard summary with key metrics."""
    service = ReportService(db)
    return service.get_dashboard_summary()


@router.get("/sales")
def get_sales_report(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get sales report with optional filtering.
    
    Query parameters:
    - start_date: Filter from date (ISO format)
    - end_date: Filter to date (ISO format)
    - customer_id: Filter by customer ID
    - status: Filter by order status (DRAFT, CONFIRMED, PAID, CANCELLED)
    """
    service = ReportService(db)
    return service.get_sales_report(
        start_date=start_date,
        end_date=end_date,
        customer_id=customer_id,
        status=status
    )


@router.get("/inventory")
def get_inventory_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current inventory report with stock levels and valuations."""
    service = ReportService(db)
    return service.get_inventory_report()


@router.get("/suppliers")
def get_supplier_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get supplier performance report."""
    service = ReportService(db)
    return service.get_supplier_report()


@router.get("/revenue")
def get_revenue_report(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get revenue summary for the last N days.
    
    Query parameters:
    - days: Number of days to include (default: 30)
    """
    service = ReportService(db)
    return service.get_revenue_summary(days=days)


@router.get("/stock-transactions")
def get_stock_transactions_report(
    product_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get stock transaction audit report.
    
    Query parameters:
    - product_id: Filter by product ID
    - transaction_type: Filter by IN or OUT
    - days: Number of days to look back (default: 30)
    """
    service = ReportService(db)
    return service.get_stock_transactions_report(
        product_id=product_id,
        transaction_type=transaction_type,
        days=days
    )
