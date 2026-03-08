"""
API endpoints for sales order management.
"""
import io
from typing import List
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, SalesOrder, Customer
from app.schemas import SalesOrderCreate, SalesOrderResponse, SalesOrderItemCreate
from app.services import SalesOrderService

router = APIRouter(prefix="/api/v1/sales", tags=["sales"])


class CustomerOrderItem(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)


class CustomerOrderRequest(BaseModel):
    items: List[CustomerOrderItem]


@router.post("", response_model=SalesOrderResponse, status_code=status.HTTP_201_CREATED)
def create_sales_order(
    sales_data: SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new sales order. Requires authentication."""
    try:
        service = SalesOrderService(db)
        sales_order = service.create_sales_order(sales_data)
        return sales_order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[SalesOrderResponse])
def list_sales_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all sales orders with pagination."""
    service = SalesOrderService(db)
    return service.get_orders_by_status("", skip, limit)


@router.post("/customer-order", response_model=SalesOrderResponse, status_code=status.HTTP_201_CREATED)
def create_customer_order(
    order_data: CustomerOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Customer places an order — auto-resolves customer record by email."""
    if current_user.role not in ("CUSTOMER", "VIEWER"):
        raise HTTPException(status_code=403, detail="Only customers can use this endpoint")

    # Find or create Customer record matching this user
    customer = db.query(Customer).filter(Customer.email == current_user.email).first()
    if not customer:
        customer = Customer(name=current_user.username, email=current_user.email)
        db.add(customer)
        db.commit()
        db.refresh(customer)

    try:
        service = SalesOrderService(db)
        sales_data = SalesOrderCreate(
            customer_id=customer.id,
            items=[SalesOrderItemCreate(**item.dict()) for item in order_data.items],
            tax_amount=Decimal("0"),
            discount_amount=Decimal("0"),
        )
        return service.create_sales_order(sales_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{sales_id}/pay", response_model=SalesOrderResponse)
def customer_pay_order(
    sales_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Customer marks a confirmed order as paid."""
    try:
        service = SalesOrderService(db)
        order = service.get_sales_order(sales_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Verify customer ownership
        if current_user.role in ("CUSTOMER", "VIEWER"):
            customer = db.query(Customer).filter(Customer.email == current_user.email).first()
            if not customer or order.customer_id != customer.id:
                raise HTTPException(status_code=403, detail="Not your order")

        return service.mark_order_paid(sales_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{sales_id}", response_model=SalesOrderResponse)
def get_sales_order(
    sales_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get sales order by ID."""
    service = SalesOrderService(db)
    sales_order = service.get_sales_order(sales_id)
    if not sales_order:
        raise HTTPException(status_code=404, detail="Sales order not found")
    return sales_order


@router.get("/customer/{customer_id}", response_model=List[SalesOrderResponse])
def get_customer_sales(
    customer_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all sales orders from a specific customer."""
    service = SalesOrderService(db)
    return service.get_customer_orders(customer_id, skip, limit)


@router.post("/{sales_id}/confirm", response_model=SalesOrderResponse)
def confirm_sales_order(
    sales_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Confirm sales order (deduct stock)."""
    try:
        service = SalesOrderService(db)
        sales_order = service.confirm_sales_order(sales_id)
        if not sales_order:
            raise HTTPException(status_code=404, detail="Sales order not found")
        return sales_order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{sales_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_sales_order(
    sales_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel sales order."""
    try:
        service = SalesOrderService(db)
        sales_order = service.cancel_sales_order(sales_id)
        if not sales_order:
            raise HTTPException(status_code=404, detail="Sales order not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{sales_id}/costs")
def update_sales_costs(
    sales_id: int,
    tax_amount: Decimal,
    discount_amount: Decimal,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update tax and discount for a draft sales order."""
    try:
        service = SalesOrderService(db)
        sales_order = service.update_order_costs(sales_id, tax_amount, discount_amount)
        if not sales_order:
            raise HTTPException(status_code=404, detail="Sales order not found")
        return sales_order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{sales_id}/invoice")
def download_invoice(
    sales_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate and download a PDF invoice for a sales order."""
    order = db.query(SalesOrder).filter(SalesOrder.id == sales_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sales order not found")

    customer = db.query(Customer).filter(Customer.id == order.customer_id).first()

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import mm

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("ERP-Lite Invoice", styles['Title']))
        elements.append(Spacer(1, 10*mm))

        info_data = [
            ["Invoice #:", order.invoice_number or f"INV-{order.id}"],
            ["Date:", str(order.created_at.strftime("%Y-%m-%d") if order.created_at else "-")],
            ["Status:", order.status],
            ["Customer:", customer.name if customer else "-"],
        ]
        info_table = Table(info_data, colWidths=[100, 300])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 10*mm))

        header = ["#", "Product", "Qty", "Unit Price", "Subtotal"]
        rows = [header]
        for idx, item in enumerate(order.items, 1):
            product_name = item.product.name if item.product else f"Product #{item.product_id}"
            rows.append([
                str(idx),
                product_name,
                str(item.quantity),
                f"${float(item.unit_price):.2f}",
                f"${float(item.subtotal):.2f}",
            ])

        items_table = Table(rows, colWidths=[30, 220, 60, 80, 80])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f4788')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 8*mm))

        totals_data = [
            ["Subtotal:", f"${float(order.subtotal):.2f}"],
            ["Tax:", f"${float(order.tax_amount):.2f}"],
            ["Discount:", f"-${float(order.discount_amount):.2f}"],
            ["Total:", f"${float(order.total_amount):.2f}"],
        ]
        totals_table = Table(totals_data, colWidths=[380, 90])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(totals_table)

        doc.build(elements)
        buffer.seek(0)

        filename = f"invoice_{order.invoice_number or order.id}.pdf"
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ImportError:
        raise HTTPException(status_code=500, detail="PDF generation library not available")
