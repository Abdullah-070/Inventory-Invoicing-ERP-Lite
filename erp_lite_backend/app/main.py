"""
Main FastAPI application.
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.models import User, UserRole
from app.core.security import hash_password
from app.api import auth, products, customers, suppliers, purchases, sales, reports, categories, payments, stock_transactions

# Create tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Offline Inventory & Invoicing ERP-Lite System",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(customers.router)
app.include_router(suppliers.router)
app.include_router(sales.router)
app.include_router(purchases.router)
app.include_router(payments.router)
app.include_router(stock_transactions.router)
app.include_router(reports.router)


@app.on_event("startup")
async def startup_event():
    """Initialize default admin user on startup."""
    try:
        from app.core.database import SessionLocal
        db = SessionLocal()
        try:
            # Check if admin user exists
            admin_user = db.query(User).filter(User.username == "admin").first()
            if not admin_user:
                # Create admin user
                admin_user = User(
                    username="admin",
                    email="admin@erp-lite.local",
                    hashed_password=hash_password("admin123"),
                    role=UserRole.ADMIN.value,
                    is_active=True
                )
                db.add(admin_user)
                db.commit()
        finally:
            db.close()
    except Exception as e:
        print(f"Warning: Could not initialize admin user: {str(e)}")


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# Custom OpenAPI schema
def custom_openapi():
    """Custom OpenAPI schema configuration."""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Offline Inventory & Invoicing ERP-Lite System - No external dependencies",
        routes=app.routes,
    )
    
    # Add security scheme for JWT
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
