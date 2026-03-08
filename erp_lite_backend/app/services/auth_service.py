"""
Service layer - business logic for authentication.
"""
from datetime import timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token, verify_token
from app.models import User
from app.repositories import UserRepository
from app.schemas import UserCreate, TokenData


class AuthService:
    """Authentication service."""
    
    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db
        self.user_repo = UserRepository(db, User)
    
    def register_user(self, user_data: UserCreate) -> User:
        """
        Register a new user.
        
        Args:
            user_data: User creation data
            
        Returns:
            Created user
            
        Raises:
            ValueError: If username or email already exists
        """
        if self.user_repo.get_by_username(user_data.username):
            raise ValueError("Username already exists")
        
        if self.user_repo.get_by_email(user_data.email):
            raise ValueError("Email already exists")
        
        # Create user with hashed password, force CUSTOMER role for self-registration
        user_dict = user_data.dict()
        user_dict["hashed_password"] = hash_password(user_data.password)
        del user_dict["password"]
        user_dict["role"] = "CUSTOMER"
        
        user = User(**user_dict)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """
        Authenticate user with username and password.
        
        Args:
            username: Username
            password: Plain text password
            
        Returns:
            User if authentication successful, None otherwise
        """
        try:
            user = self.user_repo.get_by_username(username)
            if not user or not user.is_active:
                return None
            
            if not verify_password(password, user.hashed_password):
                return None
            
            return user
        except Exception as e:
            print(f"Error authenticating user {username}: {str(e)}")
            return None
    
    def create_access_token_for_user(self, user: User) -> str:
        """
        Create access token for user.
        
        Args:
            user: User object
            
        Returns:
            JWT access token
        """
        data = {
            "sub": user.id,
            "user_id": user.id,
            "username": user.username,
            "role": user.role,
        }
        return create_access_token(data)
    
    def verify_token_and_get_user(self, token: str) -> Optional[User]:
        """
        Verify token and get user.
        
        Args:
            token: JWT token
            
        Returns:
            User if token is valid, None otherwise
        """
        payload = verify_token(token)
        if not payload:
            return None
        
        user_id = payload.get("user_id")
        if not user_id:
            return None
        
        user = self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            return None
        
        return user
