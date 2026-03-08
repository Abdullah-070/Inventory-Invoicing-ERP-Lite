"""
Stock Transactions API routes.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, StockTransaction
from app.schemas import StockTransactionResponse

router = APIRouter(prefix="/api/v1/stock-transactions", tags=["stock-transactions"])


@router.get("", response_model=List[StockTransactionResponse])
def list_stock_transactions(
    product_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all stock transactions with optional filtering."""
    query = db.query(StockTransaction)
    if product_id:
        query = query.filter(StockTransaction.product_id == product_id)
    if transaction_type:
        query = query.filter(StockTransaction.type == transaction_type)
    return query.order_by(StockTransaction.created_at.desc()).offset(skip).limit(limit).all()
