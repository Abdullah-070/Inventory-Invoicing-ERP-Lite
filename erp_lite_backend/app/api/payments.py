"""
Payments API routes.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, UserRole, Payment, Customer, Supplier, LedgerEntry
from app.schemas import PaymentCreate, PaymentResponse

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])


def check_admin_or_staff(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN.value, UserRole.STAFF.value]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin or staff can access this resource")
    return current_user


@router.get("", response_model=List[PaymentResponse])
def list_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all payments."""
    return db.query(Payment).order_by(Payment.created_at.desc()).all()


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_or_staff)
):
    """Record a new payment."""
    payment = Payment(
        entity_type=data.entity_type,
        amount=data.amount,
        payment_method=data.payment_method,
        reference_note=data.reference_note,
    )

    if data.entity_type == "CUSTOMER":
        customer = db.query(Customer).filter(Customer.id == data.entity_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        payment.customer_id = data.entity_id
    elif data.entity_type == "SUPPLIER":
        supplier = db.query(Supplier).filter(Supplier.id == data.entity_id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        payment.supplier_id = data.entity_id
    else:
        raise HTTPException(status_code=400, detail="entity_type must be CUSTOMER or SUPPLIER")

    db.add(payment)

    # Create ledger entry
    ledger = LedgerEntry(
        entity_type=data.entity_type,
        customer_id=payment.customer_id,
        supplier_id=payment.supplier_id,
        debit=data.amount if data.entity_type == "SUPPLIER" else 0,
        credit=data.amount if data.entity_type == "CUSTOMER" else 0,
        description=f"Payment via {data.payment_method}" + (f" - {data.reference_note}" if data.reference_note else ""),
    )
    db.add(ledger)

    db.commit()
    db.refresh(payment)
    return payment


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payment by ID."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment
