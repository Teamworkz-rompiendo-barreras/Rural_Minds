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
    
    info["errors"] = errors
    return info
