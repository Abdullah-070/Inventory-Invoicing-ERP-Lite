"""
Unit tests for auth service
"""
import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from app.models import User
from app.schemas import UserCreate


def test_password_hashing():
    """Test password hashing and verification"""
    password = "testpassword123"
    hashed = hash_password(password)
    
    # Hashed password should not equal original
    assert hashed != password
    
    # Verification should work
    assert verify_password(password, hashed)
    
    # Wrong password should fail
    assert not verify_password("wrongpassword", hashed)


def test_token_generation_and_decoding():
    """Test JWT token generation and decoding"""
    user_id = 1
    token = create_access_token(user_id)
    
    # Token should not be empty
    assert token
    assert isinstance(token, str)
    
    # Decoded token should have user_id in sub claim
    decoded = decode_token(token)
    assert decoded is not None
    assert decoded.get("sub") == str(user_id)


def test_token_invalid():
    """Test invalid token handling"""
    invalid_token = "invalid.token.here"
    decoded = decode_token(invalid_token)
    assert decoded is None
