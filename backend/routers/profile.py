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
    
    # Update fields
    if profile_update.bio is not None:
        profile.bio = profile_update.bio
    if profile_update.skills is not None:
        profile.skills = profile_update.skills
    if profile_update.preferences is not None:
        profile.preferences = profile_update.preferences
    if profile_update.neurodivergent_traits is not None:
        profile.neurodivergent_traits = profile_update.neurodivergent_traits
        
    db.commit()
    db.refresh(profile)
    return profile
