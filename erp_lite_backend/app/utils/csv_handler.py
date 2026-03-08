"""
CSV import/export utilities.
"""
import csv
from pathlib import Path
from typing import List, Dict, Any
from io import StringIO

from app.core.config import settings


class CSVHandler:
    """Handle CSV import and export operations."""
    
    @staticmethod
    def import_products_csv(file_path: Path) -> tuple[List[Dict[str, Any]], List[str]]:
        """
        Import products from CSV file.
        
        Expected columns: sku, name, description, category_id, cost_price, selling_price, reorder_level
        
        Args:
            file_path: Path to CSV file
            
        Returns:
            Tuple of (valid_products, error_messages)
        """
        products = []
        errors = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                required_fields = {'sku', 'name', 'category_id', 'cost_price', 'selling_price'}
                
                if not reader.fieldnames:
                    errors.append("CSV file is empty")
                    return products, errors
                
                missing_fields = required_fields - set(reader.fieldnames)
                if missing_fields:
                    errors.append(f"Missing required columns: {', '.join(missing_fields)}")
                    return products, errors
                
                for row_num, row in enumerate(reader, start=2):
                    try:
                        # Validate required fields
                        for field in required_fields:
                            if not row.get(field, '').strip():
                                raise ValueError(f"Missing required field: {field}")
                        
                        product = {
                            'sku': row['sku'].strip(),
                            'name': row['name'].strip(),
                            'description': row.get('description', '').strip() or None,
                            'category_id': int(row['category_id']),
                            'cost_price': float(row['cost_price']),
                            'selling_price': float(row['selling_price']),
                            'reorder_level': int(row.get('reorder_level', 10)),
                            'is_active': row.get('is_active', 'true').lower() == 'true',
                        }
                        
                        # Validate prices
                        if product['cost_price'] < 0 or product['selling_price'] < 0:
                            raise ValueError("Prices cannot be negative")
                        
                        products.append(product)
                        
                    except (ValueError, KeyError) as e:
                        errors.append(f"Row {row_num}: {str(e)}")
        
        except Exception as e:
            errors.append(f"Error reading CSV file: {str(e)}")
        
        return products, errors
    
    @staticmethod
    def export_products_csv(products: List[Dict[str, Any]]) -> str:
        """
        Export products to CSV format.
        
        Args:
            products: List of product dictionaries
            
        Returns:
            CSV content as string
        """
        if not products:
            return ""
        
        output = StringIO()
        fieldnames = ['id', 'sku', 'name', 'description', 'category_id', 'cost_price', 
                      'selling_price', 'stock_quantity', 'reorder_level', 'is_active', 'created_at']
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(products)
        
        return output.getvalue()
    
    @staticmethod
    def export_customers_csv(customers: List[Dict[str, Any]]) -> str:
        """
        Export customers to CSV format.
        
        Args:
            customers: List of customer dictionaries
            
        Returns:
            CSV content as string
        """
        if not customers:
            return ""
        
        output = StringIO()
        fieldnames = ['id', 'name', 'email', 'phone', 'address', 'created_at']
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(customers)
        
        return output.getvalue()
    
    @staticmethod
    def export_sales_report_csv(sales_data: List[Dict[str, Any]]) -> str:
        """
        Export sales report to CSV format.
        
        Args:
            sales_data: List of sales records
            
        Returns:
            CSV content as string
        """
        if not sales_data:
            return ""
        
        output = StringIO()
        fieldnames = ['invoice_number', 'customer_name', 'total_amount', 'tax_amount', 
                      'discount_amount', 'status', 'created_at']
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(sales_data)
        
        return output.getvalue()
    
    @staticmethod
    def save_csv_to_file(csv_content: str, filename: str) -> Path:
        """
        Save CSV content to file in exports directory.
        
        Args:
            csv_content: CSV content as string
            filename: Output filename
            
        Returns:
            Path to saved file
        """
        filepath = settings.DATA_DIR / filename
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            f.write(csv_content)
        
        return filepath
