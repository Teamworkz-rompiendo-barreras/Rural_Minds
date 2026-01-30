from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
import datetime
import models, schemas, auth, database

router = APIRouter(
    prefix="/user",
    tags=["users"],
)

@router.get("/profile/accessibility", response_model=schemas.AccessibilityProfile)
def read_profile_accessibility(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return read_accessibility(db, current_user)

@router.put("/profile/accessibility", response_model=schemas.AccessibilityProfile)
def update_profile_accessibility(
    profile_update: schemas.AccessibilityProfileUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return update_accessibility(profile_update, db, current_user)

@router.get("/me", response_model=schemas.UserPublic)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.get("/accessibility", response_model=schemas.AccessibilityProfile)
def read_accessibility(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    profile = db.query(models.AccessibilityProfile).filter(models.AccessibilityProfile.user_id == current_user.id).first()
    if not profile:
        # Create default if missing
        profile = models.AccessibilityProfile(
            user_id=current_user.id,
            sensory_needs={}
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/accessibility", response_model=schemas.AccessibilityProfile)
def update_accessibility(
    profile_update: schemas.AccessibilityProfileUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User requires an Organization to track evidence.")

    profile = db.query(models.AccessibilityProfile).filter(models.AccessibilityProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.AccessibilityProfile(user_id=current_user.id)
        db.add(profile)
    
    # Track changes for Evidence Log
    changes = []
    if profile.prefers_reduced_motion != profile_update.prefers_reduced_motion:
        changes.append(f"Reduced Motion: {profile_update.prefers_reduced_motion}")
    if profile.high_contrast_enabled != profile_update.high_contrast_enabled:
        changes.append(f"High Contrast: {profile_update.high_contrast_enabled}")
        
    # Apply Updates
    profile.prefers_reduced_motion = profile_update.prefers_reduced_motion
    profile.high_contrast_enabled = profile_update.high_contrast_enabled
    profile.preferred_font_size = profile_update.preferred_font_size
    profile.sensory_needs = profile_update.sensory_needs
    
    db.commit()
    db.refresh(profile)
    
    # STRICT RULE: Log to Adjustments_Log
    if changes:
        for change in changes:
            log_entry = models.AdjustmentsLog(
                id=uuid.uuid4(),
                organization_id=current_user.organization_id,
                user_id=current_user.id,
                adjustment_type=change,
                impact_metric=5.0, # Initial estimated impact
                status="implemented",
                timestamp=datetime.datetime.utcnow()
            )
            db.add(log_entry)
        db.commit()
        print(f"📝 EVIDENCE LOGGED: {changes}")

    return profile
