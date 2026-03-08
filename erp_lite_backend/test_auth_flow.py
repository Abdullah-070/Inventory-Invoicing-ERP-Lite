#!/usr/bin/env python3
"""
End-to-end authentication flow test
Tests: admin login, signup with new user, login with new user
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

def test_1_admin_login():
    """Test 1: Login with admin credentials"""
    print("\n=== TEST 1: Admin Login ===")
    url = f"{BASE_URL}/api/v1/auth/login"
    payload = {"username": "admin", "password": "admin123"}
    
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Login successful")
            print(f"  User: {data['user']['username']} ({data['user']['role']})")
            print(f"  Token: {data['access_token'][:30]}...")
            return data['access_token']
        else:
            print(f"✗ Login failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def test_2_signup_new_user(token):
    """Test 2: Register a new user"""
    print("\n=== TEST 2: Signup New User ===")
    url = f"{BASE_URL}/api/v1/auth/register"
    timestamp = datetime.now().strftime("%H%M%S")
    payload = {
        "username": f"testuser{timestamp}",
        "email": f"test{timestamp}@example.com",
        "password": "Test@1234567"
    }
    
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Signup successful")
            print(f"  User: {data['user']['username']}")
            print(f"  Email: {data['user']['email']}")
            return payload['username'], payload['password']
        else:
            print(f"✗ Signup failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return None, None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None, None

def test_3_login_new_user(username, password):
    """Test 3: Login with newly created user"""
    print("\n=== TEST 3: Login New User ===")
    url = f"{BASE_URL}/api/v1/auth/login"
    payload = {"username": username, "password": password}
    
    try:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Login successful")
            print(f"  User: {data['user']['username']}")
            print(f"  Token: {data['access_token'][:30]}...")
            return data['access_token']
        else:
            print(f"✗ Login failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None

def test_4_health_check():
    """Test 4: Basic health check"""
    print("\n=== TEST 0: Health Check ===")
    url = f"{BASE_URL}/health"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            print(f"✓ Backend is healthy")
            return True
        else:
            print(f"✗ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Authentication Flow")
    print("=" * 50)
    
    # Test 0: Health check
    if not test_4_health_check():
        print("\n❌ Backend not responding. Exiting.")
        exit(1)
    
    # Test 1: Admin login
    admin_token = test_1_admin_login()
    if not admin_token:
        print("\n❌ Admin login failed. Check backend.")
        exit(1)
    
    # Test 2: Signup
    new_username, new_password = test_2_signup_new_user(admin_token)
    if not new_username:
        print("\n❌ Signup failed. Check backend.")
        exit(1)
    
    # Test 3: Login with new user
    new_token = test_3_login_new_user(new_username, new_password)
    
    # Summary
    print("\n" + "=" * 50)
    if admin_token and new_username and new_token:
        print("✅ ALL TESTS PASSED!")
        print("\nAuthentication flow is working correctly:")
        print("✓ Admin login works")
        print("✓ User signup works")
        print("✓ New user login works")
        print("\n🎉 System is ready for testing!")
    else:
        print("❌ Some tests failed")
