"""
Service layer - business logic for reports and analytics.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import (
    SalesOrder, SalesOrderItem, Purchase, Product, StockTransaction, Customer, Supplier,
    OrderStatus, StockTransactionType
)
from app.repositories import BaseRepository


class ReportService:
    """Report generation and analytics service."""
    
    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db
    
    def get_sales_report(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        customer_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate sales report with filtering options.
        
        Args:
            start_date: Filter from date
            end_date: Filter to date
            customer_id: Filter by customer
            status: Filter by order status
            
        Returns:
            Sales report with totals and details
        """
        query = self.db.query(SalesOrder)
        
        # Apply filters
        if start_date:
            query = query.filter(SalesOrder.created_at >= start_date)
        if end_date:
            query = query.filter(SalesOrder.created_at <= end_date)
        if customer_id:
            query = query.filter(SalesOrder.customer_id == customer_id)
        if status:
            query = query.filter(SalesOrder.status == status)
        
        orders = query.all()
        
        # Calculate totals
        total_revenue = sum(Decimal(order.total_amount or 0) for order in orders)
        confirmed_revenue = sum(
            Decimal(order.total_amount or 0) for order in orders 
            if order.status in [OrderStatus.CONFIRMED.value, OrderStatus.PAID.value]
        )
        
        # Orders by status
        orders_by_status = {}
        for order in orders:
            status_key = order.status or "UNKNOWN"
            if status_key not in orders_by_status:
                orders_by_status[status_key] = 0
            orders_by_status[status_key] += 1
        
        return {
            "period": {
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None
            },
            "summary": {
                "total_orders": len(orders),
                "total_revenue": float(total_revenue),
                "confirmed_revenue": float(confirmed_revenue),
                "average_order_value": float(total_revenue / len(orders)) if orders else 0
            },
            "orders_by_status": orders_by_status,
            "orders": [
                {
                    "id": order.id,
                    "customer_id": order.customer_id,
                    "total_amount": float(order.total_amount or 0),
                    "status": order.status,
                    "created_at": order.created_at.isoformat() if order.created_at else None,
                    "items_count": len(order.items)
                }
                for order in orders
            ]
        }
    
    def get_inventory_report(self) -> Dict[str, Any]:
        """
        Generate current inventory report.
        
        Returns:
            Inventory status with stock levels and valuations
        """
        products = self.db.query(Product).filter(Product.is_active == True).all()
        
        # Calculate totals
        total_items = sum(p.stock_quantity for p in products)
        total_value = sum(
            Decimal(p.stock_quantity * p.cost_price) for p in products
        )
        
        # Low stock items
        low_stock = [p for p in products if p.stock_quantity <= p.reorder_level]
        
        # Out of stock
        out_of_stock = [p for p in products if p.stock_quantity == 0]
        
        return {
            "summary": {
                "total_products": len(products),
                "total_items": total_items,
                "total_value": float(total_value),
                "low_stock_count": len(low_stock),
                "out_of_stock_count": len(out_of_stock)
            },
            "products": [
                {
                    "id": p.id,
                    "sku": p.sku,
                    "name": p.name,
                    "stock_quantity": p.stock_quantity,
                    "reorder_level": p.reorder_level,
                    "cost_price": float(p.cost_price),
                    "selling_price": float(p.selling_price),
                    "total_value": float(p.stock_quantity * p.cost_price),
                    "status": "in_stock" if p.stock_quantity > p.reorder_level
                           else "low_stock" if p.stock_quantity > 0
                           else "out_of_stock"
                }
                for p in products
            ],
            "low_stock_items": [
                {
                    "id": p.id,
                    "sku": p.sku,
                    "name": p.name,
                    "current_stock": p.stock_quantity,
                    "reorder_level": p.reorder_level,
                    "shortage": max(0, p.reorder_level - p.stock_quantity)
                }
                for p in low_stock
            ],
            "out_of_stock_items": [
                {
                    "id": p.id,
                    "sku": p.sku,
                    "name": p.name
                }
                for p in out_of_stock
            ]
        }
    
    def get_supplier_report(self) -> Dict[str, Any]:
        """
        Generate supplier performance report.
        
        Returns:
            Supplier statistics and performance metrics
        """
        suppliers = self.db.query(Supplier).all()
        
        supplier_stats = []
        for supplier in suppliers:
            # Get all purchases from this supplier
            purchases = self.db.query(Purchase).filter(
                Purchase.supplier_id == supplier.id
            ).all()
            
            total_purchase_value = sum(
                Decimal(p.total_amount or 0) for p in purchases
            )
            received_value = sum(
                Decimal(p.total_amount or 0) for p in purchases
                if p.status == OrderStatus.RECEIVED.value
            )
            
            supplier_stats.append({
                "id": supplier.id,
                "name": supplier.name,
                "email": supplier.email,
                "phone": supplier.phone,
                "total_orders": len(purchases),
                "total_spent": float(total_purchase_value),
                "received_orders": len([p for p in purchases if p.status == OrderStatus.RECEIVED.value]),
                "pending_orders": len([p for p in purchases if p.status == OrderStatus.DRAFT.value]),
                "average_order_value": float(total_purchase_value / len(purchases)) if purchases else 0
            })
        
        # Sort by total spent descending
        supplier_stats.sort(key=lambda x: x["total_spent"], reverse=True)
        
        return {
            "summary": {
                "total_suppliers": len(suppliers),
                "total_spent": sum(s["total_spent"] for s in supplier_stats),
                "average_supplier_value": sum(s["total_spent"] for s in supplier_stats) / len(suppliers) if suppliers else 0
            },
            "suppliers": supplier_stats
        }
    
    def get_revenue_summary(
        self,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Generate revenue summary for the last N days.
        
        Args:
            days: Number of days to look back
            
        Returns:
            Revenue trends and daily breakdown
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get paid orders
        orders = self.db.query(SalesOrder).filter(
            SalesOrder.created_at >= start_date,
            SalesOrder.status.in_([OrderStatus.PAID.value, OrderStatus.CONFIRMED.value])
        ).all()
        
        # Daily breakdown
        daily_revenue = {}
        for order in orders:
            day = order.created_at.date().isoformat()
            if day not in daily_revenue:
                daily_revenue[day] = Decimal("0")
            daily_revenue[day] += Decimal(order.total_amount or 0)
        
        # Sort by date
        daily_revenue = dict(sorted(daily_revenue.items()))
        
        total_revenue = sum(Decimal(v) for v in daily_revenue.values())
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": datetime.utcnow().isoformat(),
                "days": days
            },
            "summary": {
                "total_revenue": float(total_revenue),
                "average_daily": float(total_revenue / days) if days > 0 else 0,
                "total_orders": len(orders)
            },
            "daily_breakdown": {
                date: float(amount) for date, amount in daily_revenue.items()
            }
        }
    
    def get_stock_transactions_report(
        self,
        product_id: Optional[int] = None,
        transaction_type: Optional[str] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Generate stock transaction audit report.
        
        Args:
            product_id: Filter by product
            transaction_type: Filter by IN or OUT
            days: Number of days to look back
            
        Returns:
            Stock transaction details
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        query = self.db.query(StockTransaction).filter(
            StockTransaction.created_at >= start_date
        )
        
        if product_id:
            query = query.filter(StockTransaction.product_id == product_id)
        if transaction_type:
            query = query.filter(StockTransaction.type == transaction_type)
        
        transactions = query.order_by(StockTransaction.created_at.desc()).all()
        
        # Summary by type
        in_total = sum(
            t.quantity for t in transactions 
            if t.type == StockTransactionType.IN.value
        )
        out_total = sum(
            abs(t.quantity) for t in transactions 
            if t.type == StockTransactionType.OUT.value
        )
        
        return {
            "period": {
                "days": days,
                "start_date": start_date.isoformat()
            },
            "summary": {
                "total_transactions": len(transactions),
                "total_in": in_total,
                "total_out": out_total,
                "net_change": in_total - out_total
            },
            "transactions": [
                {
                    "id": t.id,
                    "product_id": t.product_id,
                    "type": t.type,
                    "quantity": t.quantity,
                    "reference_type": t.reference_type,
                    "reference_id": t.reference_id,
                    "notes": t.notes,
                    "created_at": t.created_at.isoformat() if t.created_at else None
                }
                for t in transactions
            ]
        }
    
    def get_dashboard_summary(self) -> Dict[str, Any]:
        """
        Generate quick dashboard summary with key metrics.
        Returns combined format for both AdminDashboard and AdminReports pages.
        """
        today = datetime.utcnow().date()
        start_of_day = datetime.combine(today, datetime.min.time())
        month_start = today.replace(day=1)
        
        # Inventory summary
        products = self.db.query(Product).filter(Product.is_active == True).all()
        low_stock_products = [
            {"name": p.name, "stock_quantity": p.stock_quantity, "reorder_level": p.reorder_level}
            for p in products if p.stock_quantity <= p.reorder_level
        ]
        low_stock_count = len(low_stock_products)
        out_of_stock_count = len([p for p in products if p.stock_quantity == 0])
        
        # Counts
        total_customers = self.db.query(Customer).count()
        total_suppliers = self.db.query(Supplier).count()
        
        # Today's sales
        today_sales = self.db.query(SalesOrder).filter(
            SalesOrder.created_at >= start_of_day,
            SalesOrder.status.in_([OrderStatus.CONFIRMED.value, OrderStatus.PAID.value])
        ).all()
        today_revenue = float(sum(Decimal(o.total_amount or 0) for o in today_sales))
        
        # Month's confirmed/paid sales
        month_sales = self.db.query(SalesOrder).filter(
            SalesOrder.created_at >= month_start,
            SalesOrder.status.in_([OrderStatus.CONFIRMED.value, OrderStatus.PAID.value])
        ).all()
        month_revenue = float(sum(Decimal(o.total_amount or 0) for o in month_sales))
        
        # All-time totals
        all_sales = self.db.query(SalesOrder).filter(
            SalesOrder.status.in_([OrderStatus.CONFIRMED.value, OrderStatus.PAID.value])
        ).all()
        total_revenue = float(sum(Decimal(o.total_amount or 0) for o in all_sales))
        
        all_purchases = self.db.query(Purchase).all()
        total_cost = float(sum(Decimal(p.total_cost or 0) for p in all_purchases))

        # COGS: cost of goods actually sold (confirmed/paid orders)
        cogs_rows = (
            self.db.query(
                func.sum(SalesOrderItem.quantity * Product.cost_price)
            )
            .join(SalesOrder, SalesOrderItem.order_id == SalesOrder.id)
            .join(Product, SalesOrderItem.product_id == Product.id)
            .filter(SalesOrder.status.in_([OrderStatus.CONFIRMED.value, OrderStatus.PAID.value]))
            .scalar()
        )
        cogs = float(cogs_rows) if cogs_rows else 0.0
        
        # Pending orders
        pending_sales = self.db.query(SalesOrder).filter(
            SalesOrder.status == OrderStatus.DRAFT.value
        ).count()
        pending_purchases = self.db.query(Purchase).filter(
            Purchase.status == "DRAFT"
        ).count()
        
        # Recent sales (last 10)
        recent_sales = self.db.query(SalesOrder).order_by(
            SalesOrder.created_at.desc()
        ).limit(10).all()
        
        # Daily revenue for last 7 days (for chart)
        daily_sales = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_start = datetime.combine(day, datetime.min.time())
            day_end = datetime.combine(day + timedelta(days=1), datetime.min.time())
            day_orders = self.db.query(SalesOrder).filter(
                SalesOrder.created_at >= day_start,
                SalesOrder.created_at < day_end,
                SalesOrder.status.in_([OrderStatus.CONFIRMED.value, OrderStatus.PAID.value])
            ).all()
            day_revenue = float(sum(Decimal(o.total_amount or 0) for o in day_orders))
            daily_sales.append({
                "date": day.isoformat(),
                "revenue": day_revenue,
                "orders": len(day_orders),
            })
        
        # Previous month stats for comparison
        prev_month_end = month_start - timedelta(days=1)
        prev_month_start = prev_month_end.replace(day=1)
        prev_month_sales = self.db.query(SalesOrder).filter(
            SalesOrder.created_at >= prev_month_start,
            SalesOrder.created_at < month_start,
            SalesOrder.status.in_([OrderStatus.CONFIRMED.value, OrderStatus.PAID.value])
        ).all()
        prev_month_revenue = float(sum(Decimal(o.total_amount or 0) for o in prev_month_sales))
        
        # Recent activity (last 5 completed orders with customer names)
        recent_activity = self.db.query(SalesOrder).filter(
            SalesOrder.status.in_([OrderStatus.CONFIRMED.value, OrderStatus.PAID.value])
        ).order_by(SalesOrder.created_at.desc()).limit(5).all()
        
        return {
            # Flat fields (AdminReports)
            "total_products": len(products),
            "total_customers": total_customers,
            "total_suppliers": total_suppliers,
            "total_sales": len(all_sales),
            "total_purchases": len(all_purchases),
            "total_revenue": total_revenue,
            "total_cost": total_cost,
            "cogs": cogs,
            "low_stock_products": low_stock_products,
            "recent_sales": [
                {
                    "id": s.id, "invoice_number": s.invoice_number,
                    "status": s.status, "total_amount": float(s.total_amount or 0),
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                }
                for s in recent_sales
            ],
            # Nested fields (AdminDashboard)
            "today": {"orders": len(today_sales), "revenue": today_revenue},
            "month": {"orders": len(month_sales), "revenue": month_revenue},
            "prev_month": {"orders": len(prev_month_sales), "revenue": prev_month_revenue},
            "inventory": {
                "total_products": len(products),
                "low_stock_count": low_stock_count,
                "out_of_stock_count": out_of_stock_count,
            },
            "pending": {"sales_orders": pending_sales, "purchases": pending_purchases},
            "daily_sales": daily_sales,
            "recent_activity": [
                {
                    "id": s.id,
                    "invoice_number": s.invoice_number,
                    "customer_id": s.customer_id,
                    "status": s.status,
                    "total_amount": float(s.total_amount or 0),
                    "items_count": len(s.items),
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                }
                for s in recent_activity
            ],
        }
