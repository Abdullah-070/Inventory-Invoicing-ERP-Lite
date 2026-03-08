"""
Background scheduler for automated tasks.
"""
import logging
from datetime import datetime, timedelta
import shutil
from pathlib import Path

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models import Product
from app.repositories import BaseRepository
from app.scheduler.jobs import send_invoice_reminders

logger = logging.getLogger(__name__)


def backup_database():
    """
    Create daily SQLite database backup.
    """
    try:
        if not settings.DATABASE_URL.startswith("sqlite"):
            return
        
        # Get database file path
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        db_file = Path(db_path)
        
        if not db_file.exists():
            return
        
        # Create backup with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = settings.BACKUPS_DIR / f"erp_lite_backup_{timestamp}.db"
        
        shutil.copy2(db_file, backup_file)
        logger.info(f"Database backup created: {backup_file}")
        
        # Keep only last 7 backups
        backups = sorted(settings.BACKUPS_DIR.glob("erp_lite_backup_*.db"))
        if len(backups) > 7:
            for old_backup in backups[:-7]:
                old_backup.unlink()
                logger.info(f"Old backup deleted: {old_backup}")
        
    except Exception as e:
        logger.error(f"Error creating database backup: {str(e)}")


def check_low_stock():
    """
    Scan for low stock products and flag them.
    """
    try:
        db = SessionLocal()
        product_repo = BaseRepository(db, Product)
        
        low_stock_products = db.query(Product).filter(
            Product.stock_quantity <= Product.reorder_level,
            Product.is_active == True
        ).all()
        
        if low_stock_products:
            logger.warning(f"Low stock alert: {len(low_stock_products)} products below reorder level")
            for product in low_stock_products:
                logger.warning(f"  - {product.sku}: {product.stock_quantity} units (reorder level: {product.reorder_level})")
        
        db.close()
        
    except Exception as e:
        logger.error(f"Error checking low stock: {str(e)}")


def generate_daily_summary():
    """
    Generate daily sales summary (stored locally).
    """
    try:
        from app.models import SalesOrder, OrderStatus
        
        db = SessionLocal()
        
        # Get today's sales
        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        daily_sales = db.query(SalesOrder).filter(
            SalesOrder.created_at >= today_start,
            SalesOrder.created_at <= today_end,
            SalesOrder.status != OrderStatus.CANCELLED.value
        ).all()
        
        if daily_sales:
            total_revenue = sum(order.total_amount for order in daily_sales)
            confirmed_orders = len([o for o in daily_sales if o.status == OrderStatus.CONFIRMED.value])
            paid_orders = len([o for o in daily_sales if o.status == OrderStatus.PAID.value])
            
            summary = f"""
Daily Sales Summary - {today}
======================================
Total Orders: {len(daily_sales)}
Confirmed: {confirmed_orders}
Paid: {paid_orders}
Total Revenue: ${total_revenue:.2f}
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
            
            # Save summary to file
            summary_file = settings.DATA_DIR / f"daily_summary_{today}.txt"
            with open(summary_file, 'w') as f:
                f.write(summary)
            
            logger.info(f"Daily summary generated: {summary_file}")
        
        db.close()
        
    except Exception as e:
        logger.error(f"Error generating daily summary: {str(e)}")


def start_scheduler():
    """
    Start background scheduler.
    """
    if not settings.SCHEDULER_ENABLED:
        logger.info("Scheduler is disabled")
        return None
    
    scheduler = BackgroundScheduler()
    
    # Add jobs
    scheduler.add_job(
        backup_database,
        'cron',
        hour=2,
        minute=0,
        id='backup_db',
        name='Database Backup'
    )
    
    scheduler.add_job(
        check_low_stock,
        'interval',
        hours=1,
        id='check_low_stock',
        name='Low Stock Check'
    )
    
    scheduler.add_job(
        generate_daily_summary,
        'cron',
        hour=23,
        minute=59,
        id='daily_summary',
        name='Daily Sales Summary'
    )

    scheduler.add_job(
        send_invoice_reminders,
        'cron',
        hour=9,
        minute=0,
        id='invoice_reminders',
        name='Invoice Reminders'
    )

    scheduler.start()
    logger.info("Background scheduler started")
    
    return scheduler


# Global scheduler instance
scheduler_instance = None


def get_scheduler():
    """Get scheduler instance."""
    global scheduler_instance
    if scheduler_instance is None:
        scheduler_instance = start_scheduler()
    return scheduler_instance


def shutdown_scheduler():
    """Shutdown scheduler."""
    global scheduler_instance
    if scheduler_instance:
        scheduler_instance.shutdown()
        logger.info("Background scheduler stopped")
