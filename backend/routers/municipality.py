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
    if current_user.role != "territory_admin":
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
    if current_user.role != "territory_admin":
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
            {"name": o.name, "email": "N/A", "status": "active", "logo": o.logo_url} 
            for o in active
        ]
    }
