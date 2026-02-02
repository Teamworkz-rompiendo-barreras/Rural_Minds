from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import models, database
import os

router = APIRouter(
    prefix="/debug",
    tags=["debug"],
)

@router.get("/info")
def debug_info(db: Session = Depends(database.get_db)):
    # 1. Check DB Connection String (Masked)
    db_url = os.getenv("DATABASE_URL", "NOT_SET")
    is_sqlite = "sqlite" in db_url
    masked_url = db_url[:20] + "..." if db_url else "None"
    
    # 2. Count Users
    try:
        user_count = db.query(models.User).count()
        users = db.query(models.User.email, models.User.role).all()
        user_list = [{"email": u[0], "role": u[1]} for u in users]
        db_status = "Connected"
    except Exception as e:
        user_count = -1
        user_list = []
        db_status = f"Error: {str(e)}"

    # 3. Check Email Config
    resend_key = os.getenv("RESEND_API_KEY", "")
    email_active = bool(resend_key)
    
    return {
        "database_type": "SQLite" if is_sqlite else "PostgreSQL",
        "connection_string_preview": masked_url,
        "db_status": db_status,
        "user_count": user_count,
        "email_service": {
            "active": email_active,
            "key_length": len(resend_key) if resend_key else 0
        },
        "users": user_list
    }


