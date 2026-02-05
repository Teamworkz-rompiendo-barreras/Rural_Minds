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
    """Aggregated KPIs for the Superadmin Dashboard."""
    
    # 1. Total Entitites
    total_orgs = db.query(models.Organization).filter(models.Organization.org_type != "municipality").count()
    total_munis = db.query(models.Organization).filter(models.Organization.org_type == "municipality").count()
    total_users = db.query(models.User).count()
    
    # 2. Sealed Companies (Excellence)
    # Using 'validation_status' which we ensured exists via DB Patch
    sealed_companies = db.query(models.Organization).filter(
        models.Organization.validation_status == 'validated'
    ).count()

    # 3. Active Municipalities (Has active admin or content)
    # For now, simplest proxy is just count of municipalities as they are created 'active' via invite
    active_municipalities = total_munis 

    # 4. Impact Metrics (Calculated)
    # Matches
    accepted_apps = db.query(models.Application).filter(models.Application.status == 'accepted').all()
    matches_count = len(accepted_apps)
    
    rooting_count = 0
    attraction_count = 0
    
    if matches_count > 0:
        for app in accepted_apps:
            # Logic: If candidate was from same province as challenge -> Rooting
            # If from different -> Attraction
            # This requires complex joins, for now we will infer from User Profile
            # Simple Heuristic: 
            # If user.is_willing_to_move = True -> likely moved -> Attraction
            # Else -> Rooting
            user = db.query(models.User).get(app.user_id)
            if user:
                # We need to check TalentProfile ideally
                profile = db.query(models.TalentProfile).filter(models.TalentProfile.user_id == user.id).first()
                if profile and profile.is_willing_to_move:
                     attraction_count += 1
                else:
                     rooting_count += 1
                     
        rooting_index = int((rooting_count / matches_count) * 100)
        attraction_rate = int((attraction_count / matches_count) * 100)
    else:
        rooting_index = 0
        attraction_rate = 0

    # Users by plan
    users_by_plan = {}
    for plan in ["starter", "growth", "enterprise"]:
        count = db.query(models.User).join(models.Organization).filter(
            models.Organization.subscription_plan == plan
        ).count()
        users_by_plan[plan] = count
    
    # Adjustments
    total_adjustments = db.query(models.AdjustmentsLog).count()
    implemented = db.query(models.AdjustmentsLog).filter(
        models.AdjustmentsLog.status == "implemented"
    ).count()
    
    # Well-being
    avg_wellbeing = db.query(func.avg(models.AdjustmentsLog.feedback_score)).filter(
        models.AdjustmentsLog.feedback_score.isnot(None)
    ).scalar() or 0
    
    return {
        "kpis": {
            "rooting_index": rooting_index,
            "attraction_rate": attraction_rate,
            "sealed_companies": sealed_companies,
            "active_municipalities": active_municipalities
        },
        "total_organizations": total_orgs,
        "total_users": total_users,
        "users_by_plan": users_by_plan,
        "total_adjustments_requested": total_adjustments,
        "adjustments_implemented": implemented,
        "global_wellbeing_avg": round(avg_wellbeing, 1)
    }

# --- New Endpoints Phase 13 ---

# --- CEREBRO OPERATIVO: Motor de Matching ---
@router.get("/matching")
def get_matching_data(
    province: Optional[str] = None,
    sector: Optional[str] = None,
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """
    Returns candidates and job offers for matching.
    Filters by province and sector if provided.
    """
    from models_location import Location
    
    # Get candidates (talents with profiles)
    candidates_query = db.query(models.User).filter(models.User.role == "talent")
    
    # Get challenges (job offers)
    challenges_query = db.query(models.Challenge).filter(models.Challenge.status == "published")
    
    candidates = []
    for user in candidates_query.limit(50).all():
        profile = db.query(models.TalentProfile).filter(models.TalentProfile.user_id == user.id).first()
        location = None
        if profile and profile.residence_location_id:
            loc = db.query(Location).filter(Location.id == profile.residence_location_id).first()
            if loc:
                location = {"province": loc.province, "municipality": loc.municipality}
        
        candidates.append({
            "id": str(user.id),
            "name": user.full_name or user.email.split("@")[0],
            "email": user.email,
            "location": location,
            "skills": profile.skills if profile else [],
            "is_willing_to_move": profile.is_willing_to_move if profile else False
        })
    
    offers = []
    for challenge in challenges_query.limit(50).all():
        org = db.query(models.Organization).filter(models.Organization.id == challenge.organization_id).first()
        location = None
        if org and org.location_id:
            loc = db.query(Location).filter(Location.id == org.location_id).first()
            if loc:
                location = {"province": loc.province, "municipality": loc.municipality}
        
        offers.append({
            "id": str(challenge.id),
            "title": challenge.title,
            "company": org.name if org else "Empresa",
            "location": location,
            "sector": challenge.category if hasattr(challenge, 'category') else None,
            "applications_count": db.query(models.Application).filter(models.Application.challenge_id == challenge.id).count()
        })
    
    return {
        "candidates": candidates,
        "offers": offers
    }

@router.post("/matching/link")
def link_candidate_to_offer(
    payload: dict,
    db: Session = Depends(database.get_db),
    admin_user: models.User = Depends(require_super_admin)
):
    """
    Creates an application linking a candidate to a job offer.
    payload: { "user_id": "...", "challenge_id": "..." }
    """
    user_id = payload.get("user_id")
    challenge_id = payload.get("challenge_id")
    
    if not user_id or not challenge_id:
        raise HTTPException(status_code=400, detail="user_id y challenge_id son obligatorios")
    
    # Check if already linked
    existing = db.query(models.Application).filter(
        models.Application.user_id == uuid.UUID(user_id),
        models.Application.challenge_id == uuid.UUID(challenge_id)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Este candidato ya tiene una solicitud para esta oferta")
    
    # Create application
    app = models.Application(
        id=uuid.uuid4(),
        user_id=uuid.UUID(user_id),
        challenge_id=uuid.UUID(challenge_id),
        status="pending"
    )
    db.add(app)
    
    # Audit log
    log = models.AuditLog(
        event_type="admin_matching",
        message=f"Admin linked candidate to offer",
        user_id=admin_user.id,
        details={"candidate_id": user_id, "challenge_id": challenge_id}
    )
    db.add(log)
    
    db.commit()
    
    return {"message": "Candidato vinculado correctamente", "application_id": str(app.id)}

# --- CEREBRO OPERATIVO: Audit Approval ---
@router.post("/audit/approve/{org_id}")
def approve_organization_seal(
    org_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    admin_user: models.User = Depends(require_super_admin)
):
    """
    Approves an organization's seal (validation_status -> validated).
    This increments the 'Empresas con Sello' widget.
    """
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    
    org.validation_status = "validated"
    
    # Audit log
    log = models.AuditLog(
        event_type="seal_approved",
        message=f"Seal approved for organization {org.name}",
        organization_id=org_id,
        user_id=admin_user.id,
        details={"organization_name": org.name}
    )
    db.add(log)
    
    db.commit()
    
    return {"message": f"Sello aprobado para {org.name}", "organization_id": str(org_id)}

@router.post("/audit/reject/{org_id}")
def reject_organization_seal(
    org_id: uuid.UUID,
    reason: str = "Sin especificar",
    db: Session = Depends(database.get_db),
    admin_user: models.User = Depends(require_super_admin)
):
    """
    Rejects an organization's seal request.
    """
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")
    
    org.validation_status = "rejected"
    
    # Audit log
    log = models.AuditLog(
        event_type="seal_rejected",
        message=f"Seal rejected for organization {org.name}: {reason}",
        organization_id=org_id,
        user_id=admin_user.id,
        details={"organization_name": org.name, "reason": reason}
    )
    db.add(log)
    
    db.commit()
    
    return {"message": f"Sello rechazado para {org.name}", "reason": reason}

# --- CEREBRO OPERATIVO: Success Stories ---
@router.get("/stories")
def list_success_stories(
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """
    Returns all success stories for the admin panel.
    """
    stories = db.query(models.SuccessStory).order_by(models.SuccessStory.created_at.desc()).all()
    return [
        {
            "id": str(s.id),
            "title": s.title,
            "description": s.description,
            "image_url": s.image_url,
            "municipality_name": s.municipality_name,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s in stories
    ]

@router.post("/stories")
def create_success_story(
    payload: dict,
    db: Session = Depends(database.get_db),
    admin_user: models.User = Depends(require_super_admin)
):
    """
    Creates a new success story.
    payload: { "title": "...", "description": "...", "image_url": "...", "municipality_name": "..." }
    """
    title = payload.get("title", "").strip()
    description = payload.get("description", "").strip()
    image_url = payload.get("image_url", "")
    municipality_name = payload.get("municipality_name", "")
    
    # Validate title (max 18 words)
    if len(title.split()) > 18:
        raise HTTPException(status_code=400, detail="El título no puede exceder 18 palabras")
    
    if not title:
        raise HTTPException(status_code=400, detail="El título es obligatorio")
    
    story = models.SuccessStory(
        id=uuid.uuid4(),
        title=title,
        description=description,
        image_url=image_url,
        municipality_name=municipality_name
    )
    db.add(story)
    
    # Audit log
    log = models.AuditLog(
        event_type="story_created",
        message=f"Success story created: {title}",
        user_id=admin_user.id,
        details={"title": title, "municipality": municipality_name}
    )
    db.add(log)
    
    db.commit()
    db.refresh(story)
    
    return {"message": "Historia de éxito creada", "id": str(story.id)}

@router.delete("/stories/{story_id}")
def delete_success_story(
    story_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    admin_user: models.User = Depends(require_super_admin)
):
    """
    Deletes a success story.
    """
    story = db.query(models.SuccessStory).filter(models.SuccessStory.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Historia no encontrada")
    
    title = story.title
    db.delete(story)
    
    # Audit log
    log = models.AuditLog(
        event_type="story_deleted",
        message=f"Success story deleted: {title}",
        user_id=admin_user.id,
        details={"story_id": str(story_id), "title": title}
    )
    db.add(log)
    
    db.commit()
    
    return {"message": f"Historia '{title}' eliminada"}

@router.get("/heatmap")
def get_heatmap_data(
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """
    Returns aggregated data by province/region for the heatmap.
    """
    from models_location import Location
    
    # Map Spanish Province Names to ISO-like IDs supported by the frontend map
    # This mapping might need adjustment based on the SVG map component
    province_map = {
        "Madrid": "ES-M", "Barcelona": "ES-B", "Valencia": "ES-V", "Sevilla": "ES-SE",
        "Zaragoza": "ES-Z", "Málaga": "ES-MA", "Murcia": "ES-MU", "Palma": "ES-PM",
        "Las Palmas": "ES-GC", "Bilbao": "ES-BI", "Alicante": "ES-A", "Córdoba": "ES-CO",
        "Valladolid": "ES-VA", "Vigo": "ES-PO", "Gijón": "ES-O", "Hospitalet": "ES-B",
        "Vitoria": "ES-VI", "Coruña": "ES-C", "Granada": "ES-GR", "Elche": "ES-A",
        "Asturias": "ES-O", "Cantabria": "ES-S", "Navarra": "ES-NA", "La Rioja": "ES-LO",
        "Cáceres": "ES-CC", "Badajoz": "ES-BA", "Toledo": "ES-TO", "Albacete": "ES-AB",
        "Ciudad Real": "ES-CR", "Cuenca": "ES-CU", "Guadalajara": "ES-GU",
        "León": "ES-LE", "Zamora": "ES-ZA", "Salamanca": "ES-SA", "Palencia": "ES-P",
        "Burgos": "ES-BU", "Soria": "ES-SO", "Segovia": "ES-SG", "Ávila": "ES-AV",
        "Lugo": "ES-LU", "Ourense": "ES-OR", "Pontevedra": "ES-PO", 
        "Huelva": "ES-H", "Cádiz": "ES-CA", "Jaén": "ES-J", "Almería": "ES-AL"
    }
    
    # Aggregate data: Count Organizations by Province
    # Join Organization -> Location
    results = db.query(Location.province, func.count(models.Organization.id))\
        .join(models.Organization, models.Organization.location_id == Location.id)\
        .group_by(Location.province).all()
        
    data = []
    for province, count in results:
        if not province: continue
        
        map_id = province_map.get(province, f"ES-{province[:2].upper()}")
        
        # Determine activity level
        activity = "low"
        if count > 10: activity = "high"
        elif count > 3: activity = "medium"
        
        data.append({
            "id": map_id,
            "name": province,
            "value": count,
            "activity": activity
        })
        
    # If no data, return a default set so the map isn't blank
    if not data:
        data = [
            {"id": "ES-M", "name": "Madrid", "value": 0, "activity": "low"},
            {"id": "ES-B", "name": "Barcelona", "value": 0, "activity": "low"}
        ]
        
    return data

@router.get("/quality-audit")
def get_quality_audit(
    limit: int = 10,
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """
    Returns latest entities for moderation (Check images, text).
    """
    # Get latest organizations
    latest_orgs = db.query(models.Organization).order_by(models.Organization.created_at.desc()).limit(limit).all()
    
    results = []
    for org in latest_orgs:
        # Check accessibility warnings
        issues = []
        if not org.branding_logo_url:
            issues.append("Falta logo")
        # Ensure we return a safe dict
        results.append({
            "id": str(org.id),
            "type": "organization" if org.org_type != "municipality" else "municipality",
            "name": org.name,
            "created_at": org.created_at.isoformat(),
            "status": org.validation_status if hasattr(org, 'validation_status') else 'pending',
            "issues": issues,
            "preview_image": org.branding_logo_url
        })
    return results

@router.get("/latest-matches")
def get_latest_matches(
    limit: int = 5,
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """
    Returns recent successful matches (accepted applications) for 'Success Stories'.
    """
    matches = db.query(models.Application).filter(models.Application.status == "accepted")\
        .order_by(models.Application.updated_at.desc()).limit(limit).all()
    
    results = []
    for m in matches:
        challenge = db.query(models.Challenge).get(m.challenge_id)
        candidate = db.query(models.User).get(m.user_id)
        
        if challenge and candidate:
            results.append({
                "id": str(m.id),
                "candidate_name": candidate.full_name,
                "job_title": challenge.title,
                "company_name": challenge.tenant.name if challenge.tenant else "Empresa",
                "date": m.updated_at.isoformat()
            })
            
    return results

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

# --- Invitation Management ---
@router.post("/invite")
def invite_entity(
    invitation: schemas.InvitationCreate,
    db: Session = Depends(database.get_db),
    admin_user: models.User = Depends(require_super_admin)
):
    """
    Send an invitation to an entity (municipality or enterprise).
    """
    from utils.email_service import send_invitation_email
    
    # Check if email already invited
    existing_invite = db.query(models.Invitation).filter(
        models.Invitation.email == invitation.email,
        models.Invitation.status == "pending"
    ).first()
    
    if existing_invite:
        raise HTTPException(status_code=400, detail="Ya existe una invitación pendiente para este email")
    
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == invitation.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Este usuario ya está registrado")

    # Create Invitation
    new_invite = models.Invitation(
        id=uuid.uuid4(),
        email=invitation.email,
        entity_name=invitation.entity_name,
        role=invitation.role,
        status="pending"
    )
    db.add(new_invite)
    db.commit()
    db.refresh(new_invite)
    
    # Send Email
    try:
        # We need a proper link here, e.g. /register?token=...
        invite_link = f"https://rural-minds.vercel.app/register?token={new_invite.id}"
        send_invitation_email(invitation.email, invitation.entity_name, invite_link)
    except Exception as e:
        print(f"Error sending email: {e}")
        # Don't fail the request, but log it
    
    return new_invite

@router.get("/invitations")
def list_invitations(
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """List all invitations."""
    return db.query(models.Invitation).order_by(models.Invitation.created_at.desc()).all()


# --- CEREBRO OPERATIVO: Detailed Audit (The Drawer) ---

@router.get("/audit/{org_id}")
def get_organization_audit_details(
    org_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """
    Returns detailed data for the 'Revisar Ficha' drawer.
    Includes identity, document status, profile completeness, and current municipality link.
    """
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organización no encontrada")

    # 1. Linked Municipality
    linked_muni = None
    if org.municipality_id:
        muni = db.query(models.Organization).filter(models.Organization.id == org.municipality_id).first()
        if muni:
            linked_muni = {"id": str(muni.id), "name": muni.name}

    # 2. Document Status (Mocked for now as we don't have a docs table yet)
    # Logic: If organization is validated, assume docs are OK. 
    # If not, check if we have enough info to consider them 'uploaded'.
    # For now, we'll check if specific fields are present as a proxy.
    
    # Use 'cif_uploaded' if added later, for now we mock based on creation time for demo
    documents = [
        {"type": "CIF / NIF", "status": "uploaded", "url": "#", "name": "cif_empresa.pdf"},
        # Escrituras removed as per requirement
    ]
    
    # If it's a very new org or draft, maybe missing?
    # For simplicity in this iteration, we return them as uploaded unless specifically flagged.

    # 3. Profile Completeness
    # We check description, industry, etc.
    description = getattr(org, 'description', "Sin descripción") # Model doesnt have description, using placeholder or check if we added it? 
    # Wait, Organization model in models.py doesn't have description. 
    # We should probably use 'industry' and 'size' as proxies for profile data or check User profile?
    # Let's return what we have.
    
    # We need to fetch the admin user to get contact info
    admin_user = db.query(models.User).filter(
        models.User.organization_id == org.id,
        models.User.role == "enterprise" # or whatever the admin role is
    ).first()

    profile_data = {
        "description": org.industry or "Sector no especificado", # Using industry as short description for now
        "website": "https://www.google.com", # Placeholder
        "contact_email": admin_user.email if admin_user else "Sin contacto",
        "employees": org.size or "N/A"
    }

    return {
        "id": str(org.id),
        "name": org.name,
        "type": org.org_type,
        "status": org.validation_status,
        "logo_url": org.branding_logo_url,
        "created_at": org.created_at.isoformat(),
        "municipality": linked_muni,
        "documents": documents,
        "profile": profile_data
    }

@router.post("/organizations/{org_id}/link-municipality")
def link_organization_to_municipality(
    org_id: uuid.UUID,
    payload: dict,
    db: Session = Depends(database.get_db),
    admin_user: models.User = Depends(require_super_admin)
):
    """
    Links an organization to a municipality node.
    payload: { "municipality_id": "uuid" }
    """
    muni_id = payload.get("municipality_id")
    if not muni_id:
         raise HTTPException(status_code=400, detail="Municipality ID required")

    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    # Verify Municipality exists
    muni = db.query(models.Organization).filter(
        models.Organization.id == uuid.UUID(muni_id),
        models.Organization.org_type == "municipality"
    ).first()
    
    if not muni:
         raise HTTPException(status_code=404, detail="Municipio no encontrado")

    previous_muni = org.municipality_id
    org.municipality_id = uuid.UUID(muni_id)
    
    # Log it
    log = models.AuditLog(
        event_type="municipality_linked",
        message=f"Linked {org.name} to {muni.name}",
        organization_id=org_id,
        user_id=admin_user.id,
        details={"previous": str(previous_muni) if previous_muni else None, "new": muni_id}
    )
    db.add(log)
    db.commit()
    
    return {"message": "Organización vinculada correctamente", "municipality_name": muni.name}

    """
    Invite a municipality or organization.
    Sends an email with a magic link to register.
    """
    import datetime
    from utils.email_service import send_invitation_email, generate_verification_token
    
    # Check if email is already used by a user
    user_exists = db.query(models.User).filter(models.User.email == invitation.email).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="Cannot invite: Email already registered as a user")
        
    # Check if email has pending invitation
    pending = db.query(models.Invitation).filter(
        models.Invitation.email == invitation.email,
        models.Invitation.status == "pending"
    ).first()
    if pending:
        # Check if expired, if so, we can re-invite
        if pending.expires_at > datetime.datetime.utcnow():
            raise HTTPException(status_code=400, detail="Invitation already sent and currently valid")
        else:
            # Mark old as expired if not already
            pending.status = "expired"
            db.commit()

    token = generate_verification_token()
    
    # Create Invitation
    new_invitation = models.Invitation(
        id=uuid.uuid4(),
        email=invitation.email,
        entity_name=invitation.entity_name,
        role=invitation.role,
        token=token,
        status="pending",
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=48)
    )
    db.add(new_invitation)
    
    # Log audit
    log = models.AuditLog(
        event_type="invitation_sent",
        message=f"Invitation sent to {invitation.email} for {invitation.entity_name}",
        user_id=admin_user.id,
        details={"email": invitation.email, "role": invitation.role}
    )
    db.add(log)
    
    db.commit()
    db.refresh(new_invitation)
    
    # Send Email
    email_sent = send_invitation_email(invitation.email, invitation.entity_name, token)
    
    return {"message": "Invitation sent successfully", "id": str(new_invitation.id), "email_sent": email_sent}


@router.get("/invitations")
def list_invitations(
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """List all invitations."""
    invitations = db.query(models.Invitation).order_by(models.Invitation.created_at.desc()).all()
    return invitations
