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


