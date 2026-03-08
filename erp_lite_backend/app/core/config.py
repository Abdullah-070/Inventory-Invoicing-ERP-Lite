"""
Application configuration using Pydantic Settings.
"""
from typing import Optional
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """
    Application settings with environment variable support.
    """
    # App
    APP_NAME: str = "ERP-Lite"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "sqlite:///./data/erp_lite.db"
    SQLALCHEMY_ECHO: bool = False
    
    # JWT & Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Paths
    BASE_DIR: Path = Path(__file__).parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    INVOICES_DIR: Path = DATA_DIR / "invoices"
    BACKUPS_DIR: Path = DATA_DIR / "backups"
    IMPORTS_DIR: Path = DATA_DIR / "imports"
    
    # Business
    COMPANY_NAME: str = "Your Company"
    COMPANY_ADDRESS: str = "Your Address"
    COMPANY_PHONE: str = "Your Phone"
    COMPANY_EMAIL: str = "info@company.com"
    COMPANY_TAX_ID: str = "TAX-ID"
    
    # Scheduler
    SCHEDULER_ENABLED: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Create necessary directories
        self.DATA_DIR.mkdir(exist_ok=True)
        self.INVOICES_DIR.mkdir(exist_ok=True)
        self.BACKUPS_DIR.mkdir(exist_ok=True)
        self.IMPORTS_DIR.mkdir(exist_ok=True)


settings = Settings()
