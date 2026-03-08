import os

# Fix api/__init__.py
api_init_path = r"e:\UNIVERSITY\Side Projects\Offline Inventory and Invoicing\erp_lite_backend\app\api\__init__.py"
api_content = '''"""API routes package."""

from app.api import auth, products, customers, suppliers

__all__ = ["auth", "products", "customers", "suppliers"]
'''

with open(api_init_path, 'w') as f:
    f.write(api_content)

print(f"Fixed {api_init_path}")

# Verify the file
with open(api_init_path, 'r') as f:
    print("File contents:")
    print(f.read())
