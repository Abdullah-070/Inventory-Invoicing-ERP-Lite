"""
Individual scheduler jobs.
Re-exported in scheduler/__init__.py; can also be invoked directly for testing.
"""
import logging
from datetime import datetime, timedelta

from app.core.database import SessionLocal
from app.models import SalesOrder, OrderStatus, Customer

logger = logging.getLogger(__name__)


def send_invoice_reminders():
    """
    Log reminders for unpaid confirmed orders older than 7 days.
    (In production this would trigger emails / push notifications.)
    """
    try:
        db = SessionLocal()
        cutoff = datetime.utcnow() - timedelta(days=7)

        overdue = (
            db.query(SalesOrder)
            .filter(
                SalesOrder.status == OrderStatus.CONFIRMED.value,
                SalesOrder.created_at < cutoff,
            )
            .all()
        )

        for order in overdue:
            customer = db.query(Customer).get(order.customer_id)
            name = customer.name if customer else f"Customer #{order.customer_id}"
            logger.warning(
                f"Invoice reminder: Order #{order.id} ({order.invoice_number or 'no inv#'}) "
                f"for {name} – amount {order.total_amount} – overdue since {order.created_at.date()}"
            )

        if overdue:
            logger.info(f"Sent {len(overdue)} invoice reminders")

        db.close()
    except Exception as e:
        logger.error(f"Error sending invoice reminders: {e}")
