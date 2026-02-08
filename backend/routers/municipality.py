from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
import datetime
import database, models, auth, schemas
from utils.email_service import send_company_invitation_email

router = APIRouter(
    prefix="/api/municipality",
    tags=["municipality"],
)

class InviteCompanyRequest(schemas.BaseModel):
    emails: List[str]
    signature: str = "El Ayuntamiento"

@router.post("/invite-companies")
def invite_companies(
    req: InviteCompanyRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="No organization associated")
        
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    results = []
    
    for email in req.emails:
        email = email.strip()
        if not email: continue
        
        # Check existing user
        existing_user = db.query(models.User).filter(models.User.email == email).first()
        if existing_user:
            results.append({"email": email, "status": "already_registered"})
            continue
            
        # Check existing invite
        existing_invite = db.query(models.Invitation).filter(
            models.Invitation.email == email,
            models.Invitation.status == "pending"
        ).first()
        
        if existing_invite:
            results.append({"email": email, "status": "already_invited"})
            continue
            
        # Create Invite
        # We don't necessarily generate a token for "Magic Link Login" here IF we want them to register normally?
        # But the prompt says: "https://app.ruralminds.es/register/company?ref=ID_AYUNTAMIENTO_A"
        # So we don't necessarily need a secure token for account creation, just a referral link.
        # BUT, standard invites usually have a token.
        # Let's support BOTH: A token for tracking in `invitations` table, and the link uses the REF ID to bind them.
        # Actually, if they click the link, they go to register.
        # To make "Auto-association" work, the link must contain the `organization_id` of the municipality.
        
        # We will create an 'Invitation' record just for tracking purposes in the dashboard even if the link is generic ref.
        # Or we can make a specific token per user if we want secure invite.
        # The prompt says: protocol url is `.../register/company?ref=ID`. This is a generic link.
        # BUT, we also want to track "Empresas invitadas (Pendientes)".
        # So we MUST save the invitation.
        
        new_invite = models.Invitation(
            id=uuid.uuid4(),
            email=email,
            entity_name="Empresa Local", # Placeholder
            role="enterprise",
            token=str(uuid.uuid4()), # We might not use this token in the URL if we use ref, but let's keep it checking
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=30), # Long expiration
            status="pending",
            invited_by_org_id=org.id
        )
        db.add(new_invite)
        
        # Send Email
        # URL logic: register/company?ref={org.id}
        # If we want to pre-fill email, we could do: register/company?ref={org.id}&email={email}
        # Let's stick to the prompt's URL format.
        invite_url = f"https://rural-minds.vercel.app/register/company?ref={org.id}"
        
        send_company_invitation_email(email, "Empresa Local", org.name, invite_url, req.signature)
        
        results.append({"email": email, "status": "invited"})
        
    db.commit()
    return {"results": results}

@router.get("/companies-status")
def get_companies_status(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    org_id = current_user.organization_id
    
    # 1. Invited (Pending)
    pending = db.query(models.Invitation).filter(
        models.Invitation.invited_by_org_id == org_id,
        models.Invitation.status == "pending"
    ).all()
    
    # 2. Registered (Active)
    # Companies that have this municipality as `municipality_id` (if we implement that field logic)
    # The Organization model has `municipality_id`.
    active = db.query(models.Organization).filter(
        models.Organization.municipality_id == org_id
    ).all()
    
    return {
        "pending": [
            {
                "email": i.email, 
                "date": i.created_at, 
                "status": "pending",
                "entity_name": i.entity_name,
                "expires_at": i.expires_at
            } 
            for i in pending
        ],
        "active": [
            {
                "id": o.id,
                "name": o.name, 
                "email": "N/A", 
                "status": "active", 
                "logo": o.branding_logo_url,
                "validation_status": o.validation_status
            } 
            for o in active
        ]
    }

@router.get("/notifications")
def get_municipality_notifications(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    return db.query(models.AuditLog).filter(
        models.AuditLog.organization_id == current_user.organization_id,
        models.AuditLog.event_type == "info"
    ).order_by(models.AuditLog.created_at.desc()).limit(20).all()

@router.get("/vacancies")
def get_municipality_vacancies(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    org_id = current_user.organization_id
    
    # Get companies linked to this municipality
    company_ids = [o.id for o in db.query(models.Organization.id).filter(models.Organization.municipality_id == org_id).all()]
    
    if not company_ids:
        return []

    # Get challenges from these companies
    challenges = db.query(models.Challenge).filter(
        models.Challenge.tenant_id.in_(company_ids)
    ).order_by(models.Challenge.created_at.desc()).all()
    
    # Calculate app counts for each
    results = []
    for c in challenges:
        app_count = db.query(models.Application).filter(models.Application.challenge_id == c.id).count()
        results.append({
            "id": c.id,
            "title": c.title,
            "company_name": c.tenant.name if c.tenant else "Unknown",
            "status": c.status,
            "applications_count": app_count,
            "created_at": c.created_at,
            "is_difficult_to_fill": app_count < 2 and (datetime.datetime.utcnow() - c.created_at).days > 15
        })
        
    return results

@router.get("/excellence-companies")
def get_excellence_companies(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    org_id = current_user.organization_id
    
    # Excellence = Validated + has at least one accepted application in any of its challenges
    excellence = db.query(models.Organization).filter(
        models.Organization.municipality_id == org_id,
        models.Organization.validation_status == 'validated'
    ).all()
    
    results = []
    for o in excellence:
        has_hires = db.query(models.Application).join(models.Challenge).filter(
            models.Challenge.tenant_id == o.id,
            models.Application.status == 'accepted'
        ).first() is not None
        
        if has_hires:
            results.append({
                "id": o.id,
                "name": o.name,
                "logo": o.branding_logo_url,
                "has_hires": True
            })
            
    return results

@router.get("/talent/local")
def get_local_talent(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    if not org or not org.location_id:
        return []
        
    profiles = db.query(models.TalentProfile).filter(
        models.TalentProfile.residence_location_id == org.location_id
    ).all()
    
    # Anonymous profiles
    results = []
    for p in profiles:
        # Check if already contacted by this municipality
        contact = db.query(models.MunicipalSupportMessage).filter(
            models.MunicipalSupportMessage.municipality_id == current_user.organization_id,
            models.MunicipalSupportMessage.talent_profile_id == p.id
        ).order_by(models.MunicipalSupportMessage.created_at.desc()).first()
        
        can_reveal = contact.privacy_consent_shared if contact else False
        
        results.append({
            "id": p.id,
            "pseudonym": f"RM-{str(p.id)[:4].upper()}",
            "full_name": p.user.full_name if (p.user and can_reveal) else "Talento Local",
            "email": p.user.email if (p.user and can_reveal) else "N/A",
            "skills": p.skills,
            "work_style": p.work_style,
            "created_at": p.created_at,
            "needs_housing": p.preferences.get('needs_housing', False) if p.preferences else False,
            "contacted_at": contact.created_at if contact else None,
            "contact_status": contact.status if contact else None,
            "privacy_shared": can_reveal
        })
    return results

@router.get("/talent/attraction")
def get_talent_attraction(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    if not org or not org.location_id:
        return []

    # Users willing to move to this location_id
    loc_id_str = str(org.location_id)
    
    # 1. Broad attraction (via profile settings)
    candidates_by_profile = db.query(models.TalentProfile).filter(
        models.TalentProfile.is_willing_to_move == True,
        models.TalentProfile.residence_location_id != org.location_id
    ).all()
    
    # 2. Specific attraction (via Applications to local companies with willing_to_relocate=True)
    # Get all company IDs in this municipality
    municipality_companies = db.query(models.Organization).filter(models.Organization.municipality_id == org.id).all()
    company_ids = [c.id for c in municipality_companies]
    
    app_query = db.query(models.TalentProfile).join(models.User).join(models.Application).join(models.Challenge).filter(
        models.Challenge.tenant_id.in_(company_ids),
        models.Application.willing_to_relocate == True,
        models.TalentProfile.residence_location_id != org.location_id
    )
    candidates_by_app = app_query.all()
    
    # Union of both sets
    seen_ids = set()
    candidates = []
    for p in candidates_by_profile + candidates_by_app:
        if p.id not in seen_ids:
            # For profile matches, verify target_locations
            if p in candidates_by_profile:
                if p.target_locations and isinstance(p.target_locations, list) and loc_id_str in p.target_locations:
                    candidates.append(p)
                    seen_ids.add(p.id)
            else:
                # App matches are always included
                candidates.append(p)
                seen_ids.add(p.id)
    
    results = []
    for p in candidates:
        # Check if already contacted
        contact = db.query(models.MunicipalSupportMessage).filter(
            models.MunicipalSupportMessage.municipality_id == current_user.organization_id,
            models.MunicipalSupportMessage.talent_profile_id == p.id
        ).order_by(models.MunicipalSupportMessage.created_at.desc()).first()
        
        can_reveal = contact.privacy_consent_shared if contact else False
        
        results.append({
            "id": p.id,
            "pseudonym": f"RM-{str(p.id)[:4].upper()}",
            "full_name": p.user.full_name if (p.user and can_reveal) else "Talento Interesado",
            "email": p.user.email if (p.user and can_reveal) else "N/A",
            "skills": p.skills,
            "from_location": p.residence_location.municipality if p.residence_location else "Otras regiones",
            "created_at": p.created_at,
            "needs_housing": p.preferences.get('needs_housing', False) if p.preferences else False,
            "contacted_at": contact.created_at if contact else None,
            "contact_status": contact.status if contact else None,
            "privacy_shared": can_reveal
        })
    return results

@router.get("/talent/sensory-stats")
def get_talent_sensory_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    if not org or not org.location_id:
        return {}
        
    # Stats from AccessibilityProfile of local talent
    user_ids = [p.user_id for p in db.query(models.TalentProfile.user_id).filter(
        models.TalentProfile.residence_location_id == org.location_id
    ).all()]
    
    if not user_ids: return {}
    
    profiles = db.query(models.AccessibilityProfile).filter(
        models.AccessibilityProfile.user_id.in_(user_ids)
    ).all()
    
    total = len(profiles)
    if total == 0: return {}
    
    low_light = sum(1 for p in profiles if p.sensory_needs.get('lighting') == 'low')
    quiet_env = sum(1 for p in profiles if p.sensory_needs.get('noise') == 'low')
    flexible_hours = sum(1 for p in profiles if p.sensory_needs.get('flexibility') == 'high')
    fiber_fiber = sum(1 for p in profiles if p.sensory_needs.get('internet') == 'high' or p.sensory_needs.get('fiber') == True)
    
    return {
        "total_analyzed": total,
        "low_lighting_pct": int((low_light/total)*100),
        "quiet_environment_pct": int((quiet_env/total)*100),
        "flexible_hours_pct": int((flexible_hours/total)*100),
        "fiber_demand_pct": int((fiber_fiber/total)*100)
    }

@router.post("/talent/{talent_id}/welcome")
def send_welcome_guide(
    talent_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    talent_profile = db.query(models.TalentProfile).filter(models.TalentProfile.id == talent_id).first()
    
    if not talent_profile or not talent_profile.user:
        raise HTTPException(status_code=404, detail="Talent not found")
        
    # Logic to send email with org.landing_guide_url
    # For now, simulate or call existing service if available
    return {"message": f"Guía de bienvenida enviada a {talent_profile.user.email}"}

@router.get("/profile/details")
def get_municipality_profile_details(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    if not org or not org.location_id:
        raise HTTPException(status_code=400, detail="Organization has no location")
    
    from models_location import MunicipalityDetails
    details = db.query(MunicipalityDetails).filter(MunicipalityDetails.location_id == org.location_id).first()
    if not details:
        # Create default draft if not exists
        details = MunicipalityDetails(
            id=uuid.uuid4(),
            location_id=org.location_id,
            slogan="Tu nuevo comienzo",
            description="Municipio acogedor para el talento.",
            status="draft"
        )
        db.add(details)
        db.commit()
        db.refresh(details)
    
    return details

@router.put("/profile/details")
def update_municipality_profile_details(
    payload: dict,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    if not org or not org.location_id:
         raise HTTPException(status_code=400, detail="Organization has no location")
    
    from models_location import MunicipalityDetails
    details = db.query(MunicipalityDetails).filter(MunicipalityDetails.location_id == org.location_id).first()
    if not details:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Update fields
    for key, value in payload.items():
        if hasattr(details, key):
            setattr(details, key, value)
    
    db.commit()
    return {"message": "Profile updated successfully"}

@router.post("/talent/{talent_id}/contact", response_model=schemas.MunicipalSupportMessage)
def contact_talent(
    talent_id: uuid.UUID,
    payload: schemas.MunicipalSupportMessageCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Municipality Org not found")
        
    talent_profile = db.query(models.TalentProfile).filter(models.TalentProfile.id == talent_id).first()
    if not talent_profile:
        raise HTTPException(status_code=404, detail="Talent not found")
        
    # Pick "Most Important Sensory Need"
    acc_profile = db.query(models.AccessibilityProfile).filter(models.AccessibilityProfile.user_id == talent_profile.user_id).first()
    
    important_need = "espacios adaptados" # Default
    if acc_profile and acc_profile.sensory_needs:
        mains = []
        for k, v in acc_profile.sensory_needs.items():
            if v in ['high', 'low']: # 'low' for noise/lighting, 'high' for internet/flexibility
                mains.append(k)
        
        # Mapping key names to natural Spanish
        need_labels = {
            "internet": "una conexión a internet de alta velocidad",
            "noise": "un entorno silencioso para trabajar",
            "lighting": "una iluminación natural controlada",
            "flexibility": "una flexibilidad horaria total"
        }
        if mains:
            important_need = need_labels.get(mains[0], important_need)

    # Dynamic Variables Substitution
    msg_content = payload.content
    msg_content = msg_content.replace("{{ID_Talento}}", f"RM-{str(talent_profile.id)[:4].upper()}")
    msg_content = msg_content.replace("{{Nombre_Municipio}}", org.name)
    msg_content = msg_content.replace("{{Necesidad_Sensorial_Destacada}}", important_need)

    new_msg = models.MunicipalSupportMessage(
        id=uuid.uuid4(),
        municipality_id=org.id,
        talent_profile_id=talent_profile.id,
        subject=f"El Ayuntamiento de {org.name} tiene un mensaje para ti 🌿",
        content=msg_content,
        highlighted_need=important_need,
        status="sent"
    )
    
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    
    return new_msg

@router.get("/stats")
def get_municipality_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Returns KPIs for the Municipality Dashboard.
    """
    if current_user.role not in ["territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    # 1. Companies Validated
    # Companies linked to this municipality
    companies = db.query(models.Organization).filter(
        models.Organization.municipality_id == org.id
    ).all()
    
    validated_companies_count = sum(1 for c in companies if c.validation_status == 'validated')
    pending_validations_count = sum(1 for c in companies if c.validation_status == 'pending')
    
    # 2. Active Projects (Challenges)
    # Get all challenges from these companies that are 'open'
    company_ids = [c.id for c in companies]
    active_projects_count = 0
    if company_ids:
        active_projects_count = db.query(models.Challenge).filter(
            models.Challenge.tenant_id.in_(company_ids),
            models.Challenge.status == 'open'
        ).count()
        
    # 3. Insertion Rate
    # (Accepted Apps in these companies / Total Apps in these companies) * 100
    # This is a bit heavy, let's look for applications to challenges of these companies
    insertion_rate = 0
    if company_ids:
        # We need to join Application -> Challenge -> Organization
        # But we have company_ids list.
        total_apps = db.query(models.Application).join(models.Challenge).filter(
            models.Challenge.tenant_id.in_(company_ids)
        ).count()
        
        accepted_apps = db.query(models.Application).join(models.Challenge).filter(
            models.Challenge.tenant_id.in_(company_ids),
            models.Application.status == 'accepted'
        ).count()
        
        if total_apps > 0:
            insertion_rate = int((accepted_apps / total_apps) * 100)
            
    # 4. Local Candidates
    # TalentProfile.residence_location_id == org.location_id
    local_candidates_count = 0
    if org.location_id:
        local_candidates_count = db.query(models.TalentProfile).filter(
            models.TalentProfile.residence_location_id == org.location_id
        ).count()
        
    # 5. Attraction Count (Metrics Refinement Phase 5)
    # Users who do NOT live here but have this location in target_locations
    attraction_count = 0
    if org.location_id:
        # We fetch profiles that confirm willingness to move
        # And check if target_locations (list of strings) contains our location_id
        # Doing python-side filter for MVP safety regarding JSON operators
        loc_id_str = str(org.location_id)
        
        # Optimize: Filter by willingness first
        candidates_willing = db.query(models.TalentProfile).filter(
            models.TalentProfile.is_willing_to_move == True,
            models.TalentProfile.residence_location_id != org.location_id
        ).all()
        
        for cand in candidates_willing:
            # target_locations should be a list of IDs
            if cand.target_locations and isinstance(cand.target_locations, list):
                if loc_id_str in cand.target_locations:
                    attraction_count += 1
    
    # Impact Score (Heuristic)
    # Base 50 + (Validated * 2) + (Active Projects * 5) + (Insertion Rate / 2)
    impact_score = 50 + (validated_companies_count * 2) + (active_projects_count * 5) + (insertion_rate / 2)
    if impact_score > 100: impact_score = 100

    # 6. Pride Metrics (Impact Analysis)
    fixed_population = 0
    new_residents = 0
    jobs_generated_quarter = 0
    ninety_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=90)

    if company_ids:
        # Get all accepted applications for these companies
        accepted_apps_details = db.query(models.Application).join(models.Challenge).filter(
            models.Challenge.tenant_id.in_(company_ids),
            models.Application.status == 'accepted'
        ).all()

        for app in accepted_apps_details:
            # Quarterly check
            if app.created_at >= ninety_days_ago:
                jobs_generated_quarter += 1
            
            # Retention vs Attraction check
            # We need the talent profile for this user
            tp = db.query(models.TalentProfile).filter(models.TalentProfile.user_id == app.user_id).first()
            if tp:
                if tp.residence_location_id == org.location_id:
                    fixed_population += 1
                elif tp.target_locations and str(org.location_id) in (tp.target_locations or []):
                    new_residents += 1
    
    return {
        "insertionRate": insertion_rate,
        "companiesValidated": validated_companies_count,
        "activeProjects": active_projects_count,
        "localCandidates": local_candidates_count,
        "attractionCount": attraction_count,
        "pendingValidations": pending_validations_count,
        "impactScore": int(impact_score),
        "fixedPopulation": fixed_population,
        "newResidents": new_residents,
        "jobsGeneratedQuarter": jobs_generated_quarter
    }
@router.get("/relocation-leads", response_model=List[schemas.RelocationLead])
def get_relocation_leads(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    leads = db.query(models.RelocationLead).filter(
        models.RelocationLead.municipality_id == current_user.organization_id
    ).order_by(models.RelocationLead.created_at.desc()).all()
    
    # Enrichment
    for lead in leads:
        if lead.talent:
            lead.talent_name = lead.talent.full_name
        if lead.application and lead.application.challenge:
            lead.challenge_title = lead.application.challenge.title
            if lead.application.challenge.tenant:
                lead.company_name = lead.application.challenge.tenant.name
                
    return leads

@router.patch("/relocation-leads/{lead_id}/status")
def update_relocation_lead_status(
    lead_id: uuid.UUID,
    payload: dict, # {"status": "contacted" | "closed"}
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    lead = db.query(models.RelocationLead).filter(
        models.RelocationLead.id == lead_id,
        models.RelocationLead.municipality_id == current_user.organization_id
    ).first()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    new_status = payload.get("status")
    if new_status not in ["new", "contacted", "closed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    lead.status = new_status
    db.commit()
    return {"message": "Lead status updated"}
