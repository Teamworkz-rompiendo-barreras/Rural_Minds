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

@router.get("/test-email")
def test_email(to_email: str, db: Session = Depends(database.get_db)):
    """
    Test endpoint to verify email configuration in production.
    Custom implementation to capture exact error.
    """
    import resend
    import os
    
    # 1. Load config directly to ensure freshness
    resend_key = os.environ.get("RESEND_API_KEY")
    # Default to the one configured in env or fallback to expected default
    current_from = os.environ.get("FROM_EMAIL", "Rural Minds <noreply@ruralminds.es>")
    
    if not resend_key:
        return {"success": False, "error": "RESEND_API_KEY not found in environment variables"}
        
    resend.api_key = resend_key
    
    params = {
        "from": current_from,
        "to": [to_email],
        "subject": "Test Diagnóstico (Detailed)",
        "html": "<p>Test de envío de Rural Minds.</p>"
    }
    
    try:
        # Attempt 1: Configured sender
        response = resend.Emails.send(params)
        return {
            "success": True, 
            "response": response,
            "sender_used": current_from
        }
    except Exception as e:
        original_error = str(e)
        
        # Attempt 2: Fallback to Resend default (testing domain)
        try:
            fallback_from = "onboarding@resend.dev"
            params["from"] = fallback_from
            params["subject"] += " (Fallback Sender)"
            response_fallback = resend.Emails.send(params)
            
            return {
                "success": False,
                "original_error": original_error,
                "fallback_success": True,
                "message": f"Falló con '{current_from}' pero funcionó con '{fallback_from}'. CAUSA: Tu dominio 'ruralminds.es' no está verificado en Resend.",
                "solution": "Verifica tu dominio en el dashboard de Resend o usa 'onboarding@resend.dev' temporalmente en la variable FROM_EMAIL."
            }
        except Exception as e2:
            return {
                "success": False,
                "error": original_error,
                "fallback_error": str(e2),
                "message": "Fallo crítico. Revisa el mensaje de 'error'. Probablemente la API Key es inválida o el email de destino está bloqueado.",
                "api_key_preview": resend_key[:5] + "..."
            }



@router.post("/fix-db-schema")
def fix_db_schema(db: Session = Depends(database.get_db)):
    """
    Manually apply missing schema changes to production DB.
    Adds 'sensory_requirements' and 'is_public' to 'challenges' table if missing.
    """
    messages = []
    
    # Check 1: sensory_requirements (JSON)
    try:
        # Check if column exists is tricky in raw SQL independent of dialect,
        # but 'ALTER TABLE ... ADD COLUMN IF NOT EXISTS' is PostgreSQL 9.6+ standard.
        # SQLite doesn't support IF NOT EXISTS in ADD COLUMN, but we target Postgres for Prod.
        
        # We will try to add it. If it fails, we catch it.
        # But to be safer, we can try to selecting it first.
        
        db.execute(text("SELECT sensory_requirements FROM challenges LIMIT 1"))
        messages.append("sensory_requirements already exists.")
    except Exception:
        db.rollback() # Reset transaction
        try:
            # Try adding it
            db.execute(text("ALTER TABLE challenges ADD COLUMN sensory_requirements JSON DEFAULT '{}'"))
            db.commit()
            messages.append("ADDED sensory_requirements column.")
        except Exception as e:
            db.rollback()
            messages.append(f"FAILED to add sensory_requirements: {str(e)}")

    # Check 2: is_public (Boolean)
    try:
        db.execute(text("SELECT is_public FROM challenges LIMIT 1"))
        messages.append("is_public already exists.")
    except Exception:
        db.rollback()
        try:
            db.execute(text("ALTER TABLE challenges ADD COLUMN is_public BOOLEAN DEFAULT TRUE"))
            db.commit()
            messages.append("ADDED is_public column.")
        except Exception as e:
            messages.append(f"FAILED to add is_public: {str(e)}")

    # Check 3: validation_status (Organization)
    try:
        db.execute(text("SELECT validation_status FROM organizations LIMIT 1"))
        messages.append("validation_status (org) already exists.")
    except Exception:
        db.rollback()
        try:
            db.execute(text("ALTER TABLE organizations ADD COLUMN validation_status VARCHAR DEFAULT 'pending'"))
            db.commit()
            messages.append("ADDED validation_status column to organizations.")
        except Exception as e:
            db.rollback()
            messages.append(f"FAILED to add validation_status: {str(e)}")

    # Check 4: seal_downloaded_at (Organization)
    try:
        db.execute(text("SELECT seal_downloaded_at FROM organizations LIMIT 1"))
        messages.append("seal_downloaded_at (org) already exists.")
    except Exception:
        db.rollback()
        try:
            db.execute(text("ALTER TABLE organizations ADD COLUMN seal_downloaded_at TIMESTAMP"))
            db.commit()
            messages.append("ADDED seal_downloaded_at column to organizations.")
        except Exception as e:
            db.rollback()
            messages.append(f"FAILED to add seal_downloaded_at: {str(e)}")

    # Check 5: location_id (Organization)
    try:
        db.execute(text("SELECT location_id FROM organizations LIMIT 1"))
        messages.append("location_id (org) already exists.")
    except Exception:
        db.rollback()
        try:
            # Adding nullable GUID column
            db.execute(text("ALTER TABLE organizations ADD COLUMN location_id CHAR(36)"))
            db.commit()
            messages.append("ADDED location_id column to organizations.")
        except Exception as e:
            db.rollback()
            messages.append(f"FAILED to add location_id: {str(e)}")
            
    return {"status": "Schema Update Attempted", "logs": messages}

@router.get("/user/{email}")
def check_user(email: str, db: Session = Depends(database.get_db)):
    """Check if a user exists by email."""
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        return {"exists": True, "id": str(user.id), "email": user.email, "role": user.role}
    return {"exists": False}

@router.delete("/user/{email}")
def delete_user(email: str, db: Session = Depends(database.get_db)):
    """Force delete a user by email."""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return {"success": False, "message": "User not found"}
    
    try:
        # Manual cascade delete for safety (similar to delete_me logic)
        # 1. Delete challenges created by user
        db.execute(text("DELETE FROM challenges WHERE creator_id = :uid"), {"uid": str(user.id)})
        # 2. Delete organization membership if any
        # (This is handled by models but explicit is safer for debug)
        
        db.delete(user)
        db.commit()
        return {"success": True, "message": f"User {email} deleted successfully"}
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}
