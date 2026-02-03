"""
Minimal diagnostic endpoint for Vercel serverless.
This file bypasses all complex imports to identify crash sources.
"""
from fastapi import FastAPI

app = FastAPI(title="RuralMinds Diagnostic")

@app.get("/api/ping")
def ping():
    return {"message": "pong", "status": "alive"}

@app.get("/api/diag")
def diag():
    import sys
    import os
    
    # Add parent directory to path to allow importing backend modules
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    info = {
        "python_version": sys.version,
        "platform": sys.platform,
        "vercel": os.getenv("VERCEL", "not_set"),
        "database_url": "set" if os.getenv("DATABASE_URL") else "not_set"
    }
    
    # Try imports one by one to find the problematic one
    errors = []
    
    try:
        import passlib
        info["passlib"] = "ok"
    except Exception as e:
        errors.append(f"passlib: {e}")
    
    try:
        from passlib.context import CryptContext
        info["passlib_context"] = "ok"
    except Exception as e:
        errors.append(f"passlib_context: {e}")
    
    try:
        import sqlalchemy
        info["sqlalchemy"] = "ok"
    except Exception as e:
        errors.append(f"sqlalchemy: {e}")
    
    try:
        import psycopg2
        info["psycopg2"] = "ok"
    except Exception as e:
        errors.append(f"psycopg2: {e}")
        
    try:
        import reportlab
        info["reportlab"] = "ok"
    except Exception as e:
        errors.append(f"reportlab: {e}")
    
    try:
        import resend
        info["resend"] = "ok"
    except Exception as e:
        errors.append(f"resend: {e}")
    
    # Test backend-specific modules
    try:
        import auth
        info["auth"] = "ok"
    except Exception as e:
        errors.append(f"auth: {e}")
        
    try:
        import models
        info["models"] = "ok"
    except Exception as e:
        errors.append(f"models: {e}")
    
    try:
        import database
        info["database"] = "ok"
    except Exception as e:
        errors.append(f"database: {e}")
    
    # Test routers
    routers_to_test = [
        "routers.auth_routes",
        "routers.users",
        "routers.profile",
        "routers.challenges",
        "routers.applications",
        "routers.admin",
        "routers.municipality",
        "routers.config",
        "routers.locations",
        "routers.organizations",
    ]
    
    for router_name in routers_to_test:
        try:
            __import__(router_name)
            info[router_name] = "ok"
        except Exception as e:
            errors.append(f"{router_name}: {str(e)[:100]}")
    
    
    # Test email service
    try:
        from utils.email_service import _send_email, IS_PRODUCTION, RESEND_API_KEY
        info["email_service_is_production"] = IS_PRODUCTION
        info["email_service_key_masked"] = RESEND_API_KEY[:4] + "***" if RESEND_API_KEY else "None"
        
        # Try sending a mock email if in production
        # We won't actually send to user, but we can try the function call with a safe address if needed
        # or just verify imports are solid.
        import resend
        info["resend_version"] = resend.__version__ if hasattr(resend, "__version__") else "unknown"
        
    except Exception as e:
        errors.append(f"email_service: {e}")

    info["errors"] = errors
    return info
