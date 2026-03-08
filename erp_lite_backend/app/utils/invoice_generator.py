"""
PDF invoice generation using ReportLab.
"""
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER

from app.core.config import settings


class InvoiceGenerator:
    """Generate PDF invoices using ReportLab."""
    
    def __init__(self):
        """Initialize invoice generator."""
        self.page_width, self.page_height = letter
        self.styles = getSampleStyleSheet()
    
    def generate_invoice_pdf(self, order_data: dict, customer_data: dict, items_data: list) -> bytes:
        """
        Generate invoice PDF.
        
        Args:
            order_data: Sales order data (id, invoice_number, total_amount, etc.)
            customer_data: Customer data (name, email, address)
            items_data: List of order items with product info
            
        Returns:
            PDF bytes
        """
        # Create PDF in memory
        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(
            pdf_buffer,
            pagesize=letter,
            rightMargin=0.5*inch,
            leftMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        
        # Build content
        elements = []
        
        # Header
        elements.append(self._build_header())
        elements.append(Spacer(1, 0.3*inch))
        
        # Invoice info
        elements.append(self._build_invoice_info(order_data))
        elements.append(Spacer(1, 0.2*inch))
        
        # Customer info
        elements.append(self._build_customer_section(customer_data))
        elements.append(Spacer(1, 0.2*inch))
        
        # Items table
        elements.append(self._build_items_table(items_data))
        elements.append(Spacer(1, 0.2*inch))
        
        # Totals
        elements.append(self._build_totals_section(order_data))
        elements.append(Spacer(1, 0.3*inch))
        
        # Footer
        elements.append(self._build_footer())
        
        # Build PDF
        doc.build(elements)
        pdf_buffer.seek(0)
        return pdf_buffer.getvalue()
    
    def save_invoice(self, pdf_bytes: bytes, invoice_number: str) -> Path:
        """
        Save PDF invoice to file.
        
        Args:
            pdf_bytes: PDF content bytes
            invoice_number: Invoice number for filename
            
        Returns:
            Path to saved file
        """
        filename = f"{invoice_number}.pdf"
        filepath = settings.INVOICES_DIR / filename
        
        with open(filepath, 'wb') as f:
            f.write(pdf_bytes)
        
        return filepath
    
    def _build_header(self):
        """Build invoice header with company info."""
        header_style = ParagraphStyle(
            'CompanyHeader',
            parent=self.styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#1f4788'),
            spaceAfter=6,
            alignment=TA_CENTER
        )
        
        company_info = f"""
        <b>{settings.COMPANY_NAME}</b><br/>
        {settings.COMPANY_ADDRESS}<br/>
        Tel: {settings.COMPANY_PHONE}<br/>
        Email: {settings.COMPANY_EMAIL}<br/>
        Tax ID: {settings.COMPANY_TAX_ID}
        """
        
        return Paragraph(company_info, self.styles['Normal'])
    
    def _build_invoice_info(self, order_data: dict):
        """Build invoice details section."""
        date_issued = datetime.now().strftime("%Y-%m-%d %H:%M")
        
        info_style = ParagraphStyle(
            'InvoiceInfo',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=14
        )
        
        invoice_info = f"""
        <b>INVOICE</b><br/>
        Invoice #: {order_data.get('invoice_number', 'N/A')}<br/>
        Date: {date_issued}<br/>
        Status: {order_data.get('status', 'DRAFT')}
        """
        
        return Paragraph(invoice_info, info_style)
    
    def _build_customer_section(self, customer_data: dict):
        """Build customer section."""
        customer_style = ParagraphStyle(
            'CustomerInfo',
            parent=self.styles['Normal'],
            fontSize=9
        )
        
        customer_info = f"""
        <b>BILL TO:</b><br/>
        {customer_data.get('name', 'N/A')}<br/>
        {customer_data.get('address', '')}<br/>
        Tel: {customer_data.get('phone', '')}<br/>
        Email: {customer_data.get('email', '')}
        """
        
        return Paragraph(customer_info, customer_style)
    
    def _build_items_table(self, items_data: list) -> Table:
        """Build items table."""
        # Table header
        table_data = [
            ['SKU', 'Description', 'Qty', 'Unit Price', 'Subtotal']
        ]
        
        # Add items
        for item in items_data:
            table_data.append([
                item.get('sku', ''),
                item.get('product_name', ''),
                str(item.get('quantity', 0)),
                f"${item.get('unit_price', 0):.2f}",
                f"${item.get('subtotal', 0):.2f}"
            ])
        
        # Create table
        table = Table(table_data, colWidths=[1*inch, 2.5*inch, 0.7*inch, 1*inch, 1*inch])
        
        # Style table
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f4788')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),
        ]))
        
        return table
    
    def _build_totals_section(self, order_data: dict):
        """Build totals section."""
        totals_data = [
            ['', 'Subtotal', f"${order_data.get('subtotal', 0):.2f}"],
            ['', 'Tax', f"${order_data.get('tax_amount', 0):.2f}"],
            ['', 'Discount', f"-${order_data.get('discount_amount', 0):.2f}"],
            ['', 'TOTAL', f"${order_data.get('total_amount', 0):.2f}"],
        ]
        
        table = Table(totals_data, colWidths=[2.5*inch, 1.5*inch, 1*inch])
        table.setStyle(TableStyle([
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (1, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (1, -1), (-1, -1), 11),
            ('BACKGROUND', (1, -1), (-1, -1), colors.HexColor('#1f4788')),
            ('TEXTCOLOR', (1, -1), (-1, -1), colors.whitesmoke),
            ('GRID', (1, 0), (-1, -1), 1, colors.grey),
        ]))
        
        return table
    
    def _build_footer(self):
        """Build invoice footer."""
        footer_style = ParagraphStyle(
            'Footer',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        
        footer_text = "Thank you for your business! • Generated by ERP-Lite • Offline System"
        return Paragraph(footer_text, footer_style)
