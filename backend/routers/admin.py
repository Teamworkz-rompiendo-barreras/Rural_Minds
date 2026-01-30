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
