#!/usr/bin/env python3
import sqlite3
from passlib.context import CryptContext

# Setup password context (same as in our app)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Get the admin user's hash from database
db = sqlite3.connect('data/erp_lite.db')
cursor = db.cursor()
cursor.execute('SELECT hashed_password FROM users WHERE username=?', ('admin',))
result = cursor.fetchone()
db.close()

if not result:
    print("✗ Admin user not found!")
else:
    stored_hash = result[0]
    test_password = "admin123"
    
    print(f"Testing password verification...")
    print(f"Test password: {test_password}")
    print(f"Stored hash: {stored_hash}")
    
    try:
        # Test verification
        is_valid = pwd_context.verify(test_password, stored_hash)
        print(f"\n✓ Password verification SUCCESS!")
        print(f"  Result: {is_valid}")
    except Exception as e:
        print(f"\n✗ Password verification FAILED!")
        print(f"  Error: {e}")
        print(f"  Error type: {type(e).__name__}")

# Also test hashing and re-verifying
print("\n---")
print("Testing hash/verify cycle with new password...")
new_hash = pwd_context.hash("testpass123")
print(f"New hash: {new_hash}")
try:
    new_verify = pwd_context.verify("testpass123", new_hash)
    print(f"Verify result: {new_verify}")
except Exception as e:
    print(f"Error: {e}")
