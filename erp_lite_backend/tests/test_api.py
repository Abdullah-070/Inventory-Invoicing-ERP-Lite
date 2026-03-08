"""
Integration tests for API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import Base, engine, get_db
from app.models import User
from app.core.security import hash_password, create_access_token


@pytest.fixture
def test_client():
    """Create test client"""
    Base.metadata.create_all(bind=engine)
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user(db_session: Session):
    """Create test user"""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=hash_password("testpass123"),
        role="admin",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def auth_headers(test_user):
    """Get auth headers with valid token"""
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}


def test_root_endpoint(test_client):
    """Test root endpoint"""
    response = test_client.get("/")
    assert response.status_code == 200
    assert "app" in response.json()


def test_health_endpoint(test_client):
    """Test health check endpoint"""
    response = test_client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_login_endpoint(test_client, test_user):
    """Test login endpoint"""
    response = test_client.post(
        "/api/v1/auth/login",
        json={
            "username": "testuser",
            "password": "testpass123"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_invalid_password(test_client):
    """Test login with wrong password"""
    response = test_client.post(
        "/api/v1/auth/login",
        json={
            "username": "testuser",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401


def test_get_current_user(test_client, auth_headers, test_user):
    """Test getting current user"""
    response = test_client.get(
        "/api/v1/auth/me",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"


def test_protected_endpoint_without_token(test_client):
    """Test accessing protected endpoint without token"""
    response = test_client.get("/api/v1/products")
    assert response.status_code == 401
