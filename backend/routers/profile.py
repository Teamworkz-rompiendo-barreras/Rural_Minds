from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth, database

router = APIRouter(
    prefix="/api/profiles",
    tags=["profiles"],
)

@router.get("/me", response_model=schemas.TalentProfile)
def get_my_profile(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != "talent":
        raise HTTPException(status_code=403, detail="Only talent users have profiles")
    
    profile = current_user.talent_profile
    if not profile:
        # Auto-create empty profile if not exists
        profile = models.TalentProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/me", response_model=schemas.TalentProfile)
def update_my_profile(profile_update: schemas.TalentProfileCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != "talent":
        raise HTTPException(status_code=403, detail="Only talent users have profiles")
    
    profile = current_user.talent_profile
    if not profile:
        profile = models.TalentProfile(user_id=current_user.id)
        db.add(profile)
    
    # Capture old target locations for diffing
    old_target_locations = set(profile.target_locations or [])

    # Update fields
    if profile_update.bio is not None:
        profile.bio = profile_update.bio
    if profile_update.skills is not None:
        profile.skills = profile_update.skills
    if profile_update.preferences is not None:
        profile.preferences = profile_update.preferences
    if profile_update.neurodivergent_traits is not None:
        profile.neurodivergent_traits = profile_update.neurodivergent_traits
    
    # Location Module Updates
    if profile_update.residence_location_id is not None:
        profile.residence_location_id = profile_update.residence_location_id
    if profile_update.is_willing_to_move is not None:
        profile.is_willing_to_move = profile_update.is_willing_to_move
    if profile_update.target_locations is not None:
        profile.target_locations = profile_update.target_locations
        
    db.commit()
    db.refresh(profile)

    # Post-update: Check for new target locations and trigger welcome emails
    new_target_locations = set(profile.target_locations or [])
    added_locations = new_target_locations - old_target_locations
    
    if added_locations:
        from utils import email_service
        from models_location import Location, MunicipalityResource
        
        for loc_id in added_locations:
            # Fetch Municipality Name
            location = db.query(Location).filter(Location.id == loc_id).first()
            if location:
                # Fetch Resources (if any)
                resource = db.query(MunicipalityResource).filter(MunicipalityResource.location_id == loc_id).first()
                guide_url = resource.landing_guide_url if resource else "#"
                contact_email = resource.adl_contact_email if resource else "info@ruralminds.com"
                
                # Send Email
                email_service.send_municipality_welcome_email(
                    to_email=current_user.email,
                    talent_name=current_user.full_name,
                    municipality_name=location.municipality,
                    guide_url=guide_url,
                    contact_email=contact_email
                )

    return profile
