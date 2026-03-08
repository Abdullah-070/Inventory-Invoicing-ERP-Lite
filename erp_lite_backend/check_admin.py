#!/usr/bin/env python3
import sqlite3

db = sqlite3.connect('data/erp_lite.db')
cursor = db.cursor()

# Check if admin user exists
cursor.execute('SELECT id, username, email, hashed_password FROM users WHERE username=?', ('admin',))
result = cursor.fetchone()

if result:
    print(f'✓ Admin user found!')
    print(f'  Username: {result[1]}')
    print(f'  Email: {result[2]}')
    print(f'  Hash (first 50 chars): {result[3][:50]}...')
else:
    print('✗ No admin user found!')

# List all users
print('\nAll users in database:')
cursor.execute('SELECT id, username, email FROM users')
users = cursor.fetchall()
if users:
    for user in users:
        print(f'  - {user[1]} ({user[2]})')
else:
    print('  (none)')

db.close()
