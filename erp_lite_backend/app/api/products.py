"""
Products API routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, UserRole, Product
from app.schemas import ProductCreate, ProductUpdate, ProductResponse, ProductLowStockResponse, StockAdjustmentRequest, StockTransactionResponse
from app.services.product_service import ProductService

router = APIRouter(prefix="/api/v1/products", tags=["products"])


def check_admin_or_staff(current_user: User = Depends(get_current_user)):
    """Check if user is admin or staff."""
    if current_user.role not in [UserRole.ADMIN.value, UserRole.STAFF.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or staff can access this resource"
        )
    return current_user


@router.get("", response_model=list[ProductResponse])
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all active products."""
    service = ProductService(db)
    products = service.get_all_products(skip, limit)
    return [ProductResponse.from_orm(p) for p in products]


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_or_staff)
):
    """Create a new product (admin/staff only)."""
    service = ProductService(db)
    
    try:
        product = service.create_product(product_data)
        return ProductResponse.from_orm(product)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/low-stock", response_model=list[ProductLowStockResponse])
def get_low_stock_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get products with low stock."""
    service = ProductService(db)
    products = service.get_low_stock_products()
    return [ProductLowStockResponse.from_orm(p) for p in products]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get product by ID."""
    service = ProductService(db)
    product = service.get_product(product_id)
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return ProductResponse.from_orm(product)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_or_staff)
):
    """Update product (admin/staff only)."""
    service = ProductService(db)
    
    try:
        product = service.update_product(product_id, product_data)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        return ProductResponse.from_orm(product)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_or_staff)
):
    """Delete product (soft delete - mark as inactive)."""
    service = ProductService(db)
    
    if not service.delete_product(product_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )


@router.post("/{product_id}/adjust-stock", response_model=ProductResponse)
def adjust_stock(
    product_id: int,
    adjustment: StockAdjustmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_admin_or_staff)
):
    """Manually adjust product stock."""
    service = ProductService(db)
    
    try:
        product = service.adjust_stock(product_id, adjustment.quantity, adjustment.notes)
        return ProductResponse.from_orm(product)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{product_id}/stock-history", response_model=list[StockTransactionResponse])
def get_stock_history(
    product_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get stock transaction history for a product."""
    service = ProductService(db)
    
    # Verify product exists
    if not service.get_product(product_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    transactions = service.get_stock_history(product_id, skip, limit)
    return [StockTransactionResponse.from_orm(t) for t in transactions]
