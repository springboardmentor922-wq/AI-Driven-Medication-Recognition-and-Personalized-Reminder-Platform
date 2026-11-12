from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.core.database import get_db
from backend.app.core.config import settings

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK, summary="Health Check & DB Ping")
def check_health(db: Session = Depends(get_db)):
    """
    Verifies that the API service is healthy and the database connection is operational.
    """
    try:
        # Ping database with SELECT 1
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connectivity failed: {str(exc)}",
        )

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status,
        "database_type": "sqlite" if "sqlite" in settings.DATABASE_URL else "postgresql",
    }
