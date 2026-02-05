from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
import datetime
import database, models, auth, schemas
from utils.email_service import send_company_invitation_email

router = APIRouter(
    prefix="/municipality",
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
            {"email": i.email, "date": i.created_at, "status": "pending"} 
            for i in pending
        ],
        "active": [
            {"name": o.name, "email": "N/A", "status": "active", "logo": o.branding_logo_url} 
            for o in active
        ]
    }

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
    
    return {
        "insertionRate": insertion_rate,
        "companiesValidated": validated_companies_count,
        "activeProjects": active_projects_count,
        "localCandidates": local_candidates_count,
        "attractionCount": attraction_count,
        "pendingValidations": pending_validations_count,
        "impactScore": int(impact_score)
    }
