"""
API endpoints for purchase order management.
"""
from typing import List
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User
from app.schemas import PurchaseCreate, PurchaseResponse
from app.services import PurchaseOrderService

router = APIRouter(prefix="/api/v1/purchases", tags=["purchases"])


@router.post("", response_model=PurchaseResponse, status_code=status.HTTP_201_CREATED)
def create_purchase(
    purchase_data: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new purchase order. Requires authentication."""
    try:
        service = PurchaseOrderService(db)
        purchase = service.create_purchase_order(purchase_data)
        return purchase
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[PurchaseResponse])
def list_purchases(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all purchase orders with pagination."""
    service = PurchaseOrderService(db)
    return service.get_orders_by_status("", skip, limit)


@router.get("/{purchase_id}", response_model=PurchaseResponse)
def get_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get purchase order by ID."""
    service = PurchaseOrderService(db)
    purchase = service.get_purchase_order(purchase_id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return purchase


@router.get("/supplier/{supplier_id}", response_model=List[PurchaseResponse])
def get_supplier_purchases(
    supplier_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all purchases from a specific supplier."""
    service = PurchaseOrderService(db)
    return service.get_supplier_orders(supplier_id, skip, limit)


@router.post("/{purchase_id}/receive", response_model=PurchaseResponse)
def receive_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Receive purchase order (add stock)."""
    try:
        service = PurchaseOrderService(db)
        purchase = service.receive_purchase_order(purchase_id)
        if not purchase:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        return purchase
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{purchase_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel purchase order."""
    try:
        service = PurchaseOrderService(db)
        purchase = service.cancel_purchase_order(purchase_id)
        if not purchase:
            raise HTTPException(status_code=404, detail="Purchase order not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{purchase_id}/costs")
def update_purchase_costs(
    purchase_id: int,
    tax_amount: Decimal,
    discount_amount: Decimal,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update tax and discount for a draft purchase order."""
    try:
        service = PurchaseOrderService(db)
        purchase = service.update_order_costs(purchase_id, tax_amount, discount_amount)
        if not purchase:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        return purchase
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
