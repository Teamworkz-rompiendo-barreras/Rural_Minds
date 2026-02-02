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

    return {
        "database_type": "SQLite" if is_sqlite else "PostgreSQL",
        "connection_string_preview": masked_url,
        "db_status": db_status,
        "user_count": user_count,
        "users": user_list
    }

@router.get("/schema_fix")
def schema_fix(db: Session = Depends(database.get_db)):
    """
    Emergency endpoint to patch DB schema in production.
    Adds missing columns to 'users' table.
    """
    try:
        # PostgreSQL specific patch
        commands = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending';",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR;",
            # Organizations
            "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS org_type VARCHAR DEFAULT 'enterprise';",
            "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS municipality_id UUID;"
        ]
        
        results = []
        for cmd in commands:
            try:
                db.execute(text(cmd))
                results.append(f"✅ Executed: {cmd}")
            except Exception as e:
                # If using SQLite, syntax might differ (no IF NOT EXISTS in older versions sometimes)
                # But prod is Postgres.
                results.append(f"⚠️ Failed: {cmd} | Error: {str(e)}")
        
        db.commit()
        return {"status": "Schema Patch Attempted", "details": results}

    except Exception as e:
        return {"status": "Error", "details": str(e)}
