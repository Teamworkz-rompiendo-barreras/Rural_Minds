from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import secrets
import string
import uuid
import models, schemas, auth, database

router = APIRouter(
    prefix="/org",
    tags=["organization"],
)

# ... (Helpers match) ...

@router.get("/settings", response_model=schemas.Organization)
def read_org_settings(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    return read_org_details(db, current_user)

@router.patch("/settings", response_model=schemas.Organization)
def patch_org_settings(
    org_update: schemas.OrganizationUpdate,
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    return update_org_details(org_update, db, current_user)
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for i in range(length))

def validate_branding_contrast(logo_url: str, primary_color: str):
    # Mock Validation Logic
    # In production, this would use Pillow to analyze image contrast against the color.
    if "low-contrast" in logo_url:
         raise HTTPException(status_code=400, detail="Branding Error: Logo has insufficient contrast (WCAG AA violation).")
    return True

@router.get("/users", response_model=List[schemas.UserPublic])
def read_org_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User is not associated with any organization")
    
    users = db.query(models.User).filter(models.User.organization_id == current_user.organization_id).offset(skip).limit(limit).all()
    return users

class InviteRequest(schemas.BaseModel):
    email: str
    role: str = "enterprise"

@router.post("/invite", response_model=schemas.UserPublic)
def invite_user(
    invite: InviteRequest, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User is not associated with any organization")
    
    if current_user.role not in ["enterprise", "enterprise_admin", "super_admin", "territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Not authorized to invite users")

    # --- USER LIMIT ENFORCEMENT ---
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    if org:
        plan = org.subscription_plan or "starter"
        limit = models.PLAN_USER_LIMITS.get(plan)
        if limit is not None:
            current_count = db.query(models.User).filter(models.User.organization_id == org.id).count()
            if current_count >= limit:
                raise HTTPException(
                    status_code=403, 
                    detail=f"User limit reached for {plan} plan ({limit} users). Upgrade to add more users."
                )
    # --- END USER LIMIT ENFORCEMENT ---

    existing_user = db.query(models.User).filter(models.User.email == invite.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    temp_password = generate_random_password()
    hashed_pwd = auth.get_password_hash(temp_password)
    
    new_user = models.User(
        email=invite.email,
        hashed_password=hashed_pwd,
        role=invite.role,
        organization_id=current_user.organization_id,
        status="pending"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # In real app: Send email
    print(f"INVITE SENT TO {invite.email}. Temp Password: {temp_password}")
    
    return new_user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user(
    user_id: uuid.UUID, # UUID type
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User is not associated with any organization")
        
    if current_user.role not in ["enterprise", "enterprise_admin", "super_admin", "territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Not authorized to remove users")
        
    user_to_remove = db.query(models.User).filter(models.User.id == user_id, models.User.organization_id == current_user.organization_id).first()
    
    if not user_to_remove:
        raise HTTPException(status_code=404, detail="User not found in your organization")
        
    if user_to_remove.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    db.delete(user_to_remove)
    db.commit()
    return

@router.get("/details", response_model=schemas.Organization)
def read_org_details(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User is not associated with any organization")
        
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    return org

@router.put("/details", response_model=schemas.Organization)
def update_org_details(
    org_update: schemas.OrganizationUpdate,
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User is not associated with any organization")
        
    if current_user.role not in ["enterprise", "enterprise_admin", "super_admin", "territory_admin", "municipality"]:
        raise HTTPException(status_code=403, detail="Not authorized to update organization details")
        
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    # Validation Logic
    if org_update.branding_logo_url:
        validate_branding_contrast(org_update.branding_logo_url, org_update.primary_color_override or org.primary_color_override)

    # Update fields
    if org_update.name is not None:
        org.name = org_update.name
    if org_update.branding_logo_url is not None:
        org.branding_logo_url = org_update.branding_logo_url
    if org_update.primary_color_override is not None:
        org.primary_color_override = org_update.primary_color_override
    if org_update.industry is not None:
        org.industry = org_update.industry
    if org_update.size is not None:
        org.size = org_update.size
    if org_update.subscription_plan is not None:
        org.subscription_plan = org_update.subscription_plan
    if org_update.sensory_commitment is not None:
        org.sensory_commitment = org_update.sensory_commitment
    if org_update.street_address is not None:
        org.street_address = org_update.street_address
    if org_update.postal_code is not None:
        org.postal_code = org_update.postal_code
    if org_update.location_id is not None:
        org.location_id = org_update.location_id
        
    db.commit()
    db.refresh(org)
    return org

@router.put("/municipalities/me/details")
def update_my_municipality_details(
    payload: dict,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Update details for the logged-in municipality admin.
    """
    if current_user.role not in ["territory_admin", "municipality", "super_admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    org_id = current_user.organization_id
    
    # 1. Update Details
    details = db.query(models.MunicipalityDetails).filter(
        models.MunicipalityDetails.location_id == org_id
    ).first()
    
    if not details:
        details = models.MunicipalityDetails(
            id=uuid.uuid4(),
            location_id=org_id
        )
        db.add(details)
    
    if "slogan" in payload: details.slogan = payload["slogan"]
    if "description" in payload: details.description = payload["description"]
    if "internet_speed" in payload: details.internet_speed = payload["internet_speed"]
    if "connectivity_info" in payload: details.connectivity_info = payload["connectivity_info"]
    if "climate_co2" in payload: details.climate_co2 = payload["climate_co2"]
    if "services" in payload: details.services = payload["services"]
    if "gallery_urls" in payload: details.gallery_urls = payload["gallery_urls"]
    if "status" in payload: details.status = payload["status"]
    
    # 2. Update Resources
    resource = db.query(models.MunicipalityResource).filter(
        models.MunicipalityResource.location_id == org_id
    ).first()
    
    if not resource:
        resource = models.MunicipalityResource(
            id=uuid.uuid4(),
            location_id=org_id
        )
        db.add(resource)
        
    if "landing_guide_url" in payload: resource.landing_guide_url = payload["landing_guide_url"]
    if "adl_contact_email" in payload: resource.adl_contact_email = payload["adl_contact_email"]
    
    db.commit()
    
    return {"message": "Details updated successfully"}
