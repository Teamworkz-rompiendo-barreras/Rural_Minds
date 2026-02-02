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
        raise HTTPException(status_code=400, detail="El usuario requiere una organización para registrar la evidencia.")

    profile = db.query(models.AccessibilityProfile).filter(models.AccessibilityProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.AccessibilityProfile(user_id=current_user.id)
        db.add(profile)
    
    # Track changes for Evidence Log
    changes = []
    if profile.prefers_reduced_motion != profile_update.prefers_reduced_motion:
        val = "Activado" if profile_update.prefers_reduced_motion else "No activado"
        changes.append(f"Movimiento Reducido: {val}")
    if profile.high_contrast_enabled != profile_update.high_contrast_enabled:
        val = "Activado" if profile_update.high_contrast_enabled else "No activado"
        changes.append(f"Alto Contraste: {val}")
        
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


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Delete the current user's account and all associated data.
    """
    # 1. Delete associated data manually to avoid integrity errors
    try:
        # Delete Messages sent by user
        db.query(models.Message).filter(models.Message.sender_id == current_user.id).delete()
        
        # Delete Adjustments Logs
        db.query(models.AdjustmentsLog).filter(models.AdjustmentsLog.user_id == current_user.id).delete()
        
        # Delete Legal Consents
        db.query(models.LegalConsent).filter(models.LegalConsent.user_id == current_user.id).delete()
        
        # Delete Audit Logs
        db.query(models.AuditLog).filter(models.AuditLog.user_id == current_user.id).delete()

        # Handle Applications (and their related data)
        apps = db.query(models.Application).filter(models.Application.user_id == current_user.id).all()
        for app in apps:
            # Delete tasks for this app
            db.query(models.OnboardingTask).filter(models.OnboardingTask.application_id == app.id).delete()
            # Delete messages linked to this application (even if not sent by user)
            db.query(models.Message).filter(models.Message.application_id == app.id).delete()
            db.delete(app)
            
        # Handle Talent Profile
        db.query(models.TalentProfile).filter(models.TalentProfile.user_id == current_user.id).delete()
        
        # Handle Accessibility Profile
        db.query(models.AccessibilityProfile).filter(models.AccessibilityProfile.user_id == current_user.id).delete()

        # Handle Challenges (Unlink creator)
        challenges = db.query(models.Challenge).filter(models.Challenge.creator_id == current_user.id).all()
        for ch in challenges:
            ch.creator_id = None
        
        # 2. Delete User
        db.delete(current_user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting account: {str(e)}")
    
    return None
