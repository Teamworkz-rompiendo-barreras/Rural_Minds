"""
Admin Router - Super Admin only endpoints for SaaS management
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import uuid

import models
import database
import auth
import schemas

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)

def require_super_admin(current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return current_user

# --- Global Stats ---
@router.get("/stats/global")
def get_global_stats(
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """Aggregated KPIs across all organizations (GDPR-safe: no individual data)."""
    
    total_orgs = db.query(models.Organization).count()
    total_users = db.query(models.User).count()
    
    # Users by plan
    users_by_plan = {}
    for plan in ["starter", "growth", "enterprise"]:
        count = db.query(models.User).join(models.Organization).filter(
            models.Organization.subscription_plan == plan
        ).count()
        users_by_plan[plan] = count
    
    # Adjustments stats
    total_adjustments = db.query(models.AdjustmentsLog).count()
    implemented = db.query(models.AdjustmentsLog).filter(
        models.AdjustmentsLog.status == "implemented"
    ).count()
    
    # Average well-being (aggregated, not per-user)
    avg_wellbeing = db.query(func.avg(models.AdjustmentsLog.feedback_score)).filter(
        models.AdjustmentsLog.feedback_score.isnot(None)
    ).scalar() or 0
    
    # Profiles activation rate (global)
    total_profiles = db.query(models.AccessibilityProfile).count()
    activation_rate = int((total_profiles / total_users * 100) if total_users > 0 else 0)
    
    return {
        "total_organizations": total_orgs,
        "total_users": total_users,
        "users_by_plan": users_by_plan,
        "total_adjustments_requested": total_adjustments,
        "adjustments_implemented": implemented,
        "global_wellbeing_avg": round(avg_wellbeing, 1),
        "profile_activation_rate": f"{activation_rate}%"
    }

# --- Audit Logs ---
@router.get("/logs")
def get_audit_logs(
    limit: int = 50,
    event_type: Optional[str] = None,
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """Retrieve audit logs for support and debugging."""
    query = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc())
    
    if event_type:
        query = query.filter(models.AuditLog.event_type == event_type)
    
    return query.limit(limit).all()

@router.post("/logs")
def create_audit_log(
    event_type: str,
    message: str,
    details: dict = None,
    organization_id: uuid.UUID = None,
    user_id: uuid.UUID = None,
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """Manually create an audit log entry (for testing or manual logging)."""
    log = models.AuditLog(
        event_type=event_type,
        message=message,
        details=details or {},
        organization_id=organization_id,
        user_id=user_id
    )
    db.add(log)
    db.commit()
    return {"message": "Log created", "id": str(log.id)}

# --- Organization Management ---
@router.get("/organizations")
def list_all_organizations(
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """List all organizations with user counts."""
    orgs = db.query(models.Organization).all()
    result = []
    for org in orgs:
        user_count = db.query(models.User).filter(models.User.organization_id == org.id).count()
        limit = models.PLAN_USER_LIMITS.get(org.subscription_plan, None)
        result.append({
            "id": str(org.id),
            "name": org.name,
            "plan": org.subscription_plan,
            "user_count": user_count,
            "user_limit": limit,
            "created_at": org.created_at.isoformat() if org.created_at else None
        })
    return result

@router.delete("/organizations/{org_id}")
def delete_organization(
    org_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """Delete an organization and all its data (DANGEROUS - use with caution)."""
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Delete related data first (cascade should handle most, but being explicit)
    db.query(models.User).filter(models.User.organization_id == org_id).delete()
    db.query(models.AdjustmentsLog).filter(models.AdjustmentsLog.organization_id == org_id).delete()
    db.delete(org)
    db.commit()
    
    return {"message": f"Organization {org.name} deleted"}


# --- Municipality Management ---
@router.post("/municipalities")
def create_municipality(
    payload: dict,
    db: Session = Depends(database.get_db),
    admin_user: models.User = Depends(require_super_admin)
):
    """
    Create a new municipality with admin credentials.
    Returns the generated password so it can be shared with the municipality.
    
    Payload:
    {
        "name": "Ayuntamiento de Villa Rural",
        "admin_email": "admin@villarural.es",
        "admin_name": "Juan García",
        "plan": "enterprise",
        "send_email": true  // Optional, sends welcome email
    }
    """
    import secrets
    from utils.email_service import send_verification_email
    
    name = payload.get("name")
    admin_email = payload.get("admin_email")
    admin_name = payload.get("admin_name", admin_email.split("@")[0] if admin_email else "Administrador")
    plan = payload.get("plan", "enterprise")
    send_email = payload.get("send_email", False)
    
    # Validate required fields
    if not name or not admin_email:
        raise HTTPException(status_code=400, detail="Nombre y email del administrador son obligatorios")
    
    # Check if organization name already exists
    existing_org = db.query(models.Organization).filter(
        models.Organization.name == name
    ).first()
    if existing_org:
        raise HTTPException(status_code=400, detail="Ya existe una organización con este nombre")
    
    # Check if email already exists
    existing_user = db.query(models.User).filter(
        models.User.email == admin_email
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Este email ya está registrado")
    
    # Generate secure password
    generated_password = secrets.token_urlsafe(12)  # 16 chars, URL-safe
    
    # Create Municipality Organization
    new_org = models.Organization(
        id=uuid.uuid4(),
        name=name,
        org_type="municipality",
        subscription_plan=plan
    )
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    
    # Create Admin User for the Municipality (pre-verified for convenience)
    hashed_pwd = auth.get_password_hash(generated_password)
    
    new_user = models.User(
        id=uuid.uuid4(),
        email=admin_email,
        full_name=admin_name,
        hashed_password=hashed_pwd,
        role="territory_admin",  # Special role for municipality admins
        organization_id=new_org.id,
        status="active",
        email_verified=True  # Pre-verified since admin creates it
    )
    db.add(new_user)
    db.commit()
    
    # Create audit log
    log = models.AuditLog(
        event_type="municipality_created",
        message=f"Municipality '{name}' created by super admin",
        organization_id=new_org.id,
        user_id=admin_user.id,
        details={
            "municipality_name": name,
            "admin_email": admin_email,
            "plan": plan
        }
    )
    db.add(log)
    db.commit()
    
    # Optionally send welcome email with credentials
    if send_email:
        # Custom email for municipality with credentials
        _send_municipality_welcome(admin_email, admin_name, name, generated_password)
    
    return {
        "message": "Ayuntamiento creado correctamente",
        "organization": {
            "id": str(new_org.id),
            "name": name,
            "type": "municipality",
            "plan": plan
        },
        "admin": {
            "email": admin_email,
            "name": admin_name,
            "role": "territory_admin"
        },
        "credentials": {
            "email": admin_email,
            "password": generated_password,  # ⚠️ Only shown once!
            "login_url": "https://rural-minds.vercel.app/login"
        },
        "email_sent": send_email
    }


def _send_municipality_welcome(email: str, name: str, org_name: str, password: str):
    """Send welcome email with credentials to municipality admin."""
    import os
    try:
        import resend
        from utils.email_service import RESEND_API_KEY, FROM_EMAIL, FRONTEND_URL, IS_PRODUCTION
        
        html = f"""
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #374BA6; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="margin: 0;">🏛️ Bienvenido a Rural Minds</h1>
                <p style="opacity: 0.9; margin-top: 10px;">Innovación con denominación de origen</p>
            </div>
            <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 12px 12px;">
                <p>Hola <strong>{name}</strong>,</p>
                <p>Tu cuenta de administrador para <strong>{org_name}</strong> ha sido creada.</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #374BA6;">
                    <h3 style="margin-top: 0;">🔐 Tus credenciales de acceso:</h3>
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Contraseña:</strong> <code style="background: #eee; padding: 4px 8px; border-radius: 4px;">{password}</code></p>
                </div>
                
                <p style="color: #e74c3c; font-size: 14px;">⚠️ <strong>Importante:</strong> Cambia tu contraseña tras el primer acceso.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{FRONTEND_URL}/login" style="background: #374BA6; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Acceder a Rural Minds
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="font-size: 12px; color: #888; text-align: center;">
                    Rural Minds © 2026 | Powered by Teamworkz
                </p>
            </div>
        </body>
        </html>
        """
        
        if IS_PRODUCTION:
            resend.api_key = RESEND_API_KEY
            resend.Emails.send({
                "from": FROM_EMAIL,
                "to": [email],
                "subject": f"Credenciales de acceso - {org_name} - Rural Minds",
                "html": html
            })
        else:
            print(f"\n📧 [DEV MODE] Municipality welcome email to {email}")
            print(f"📧 Password: {password}\n")
            
    except Exception as e:
        print(f"Error sending municipality welcome email: {e}")


@router.get("/municipalities")
def list_municipalities(
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """List all municipalities with their admin users."""
    municipalities = db.query(models.Organization).filter(
        models.Organization.org_type == "municipality"
    ).all()
    
    result = []
    for muni in municipalities:
        # Get admin user
        admin = db.query(models.User).filter(
            models.User.organization_id == muni.id,
            models.User.role == "territory_admin"
        ).first()
        
        # Count associated companies
        company_count = db.query(models.Organization).filter(
            models.Organization.municipality_id == muni.id
        ).count()
        
        result.append({
            "id": str(muni.id),
            "name": muni.name,
            "plan": muni.subscription_plan,
            "created_at": muni.created_at.isoformat() if muni.created_at else None,
            "admin": {
                "email": admin.email if admin else None,
                "name": admin.full_name if admin else None,
                "status": admin.status if admin else None
            } if admin else None,
            "associated_companies": company_count
        })
    
    return result
