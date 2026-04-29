from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from fastapi import BackgroundTasks
import uuid

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
def update_my_profile(profile_update: schemas.TalentProfileCreate, background_tasks: BackgroundTasks, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
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
    if hasattr(profile_update, 'residence_international') and profile_update.residence_international is not None:
        profile.residence_international = profile_update.residence_international
    
    if profile_update.is_willing_to_move is not None:
        profile.is_willing_to_move = profile_update.is_willing_to_move
    if profile_update.target_locations is not None:
        profile.target_locations = profile_update.target_locations
        
    # Relocation Commitment Trigger
    relocation_triggered = False
    if profile_update.relocation_commitment is not None:
        if profile_update.relocation_commitment and not profile.relocation_commitment:
            relocation_triggered = True
        profile.relocation_commitment = profile_update.relocation_commitment

    db.commit()
    db.refresh(profile)

    # Post-update: Check for new target locations and trigger welcome emails
    new_target_locations = set(profile.target_locations or [])
    added_locations = new_target_locations - old_target_locations
    
    # If relocation commitment was just triggered, we treat all current target locations as "new" for notification purposes
    # or at least send a special notification.
    notify_locations = added_locations
    if relocation_triggered:
        notify_locations = new_target_locations
    
    if notify_locations:
        from utils import email_service
        from models_location import Location, MunicipalityResource
        
        for loc_id in notify_locations:
            # Fetch Municipality Name
            location = db.query(Location).filter(Location.id == loc_id).first()
            if location:
                # 1. Email to Talent (Welcome Guide)
                resource = db.query(MunicipalityResource).filter(MunicipalityResource.location_id == loc_id).first()
                guide_url = resource.landing_guide_url if resource else "#"
                contact_email = resource.adl_contact_email if resource else "info@ruralminds.com"
                
                #Código añadido por Andrés Barcenilla 28-04-2026
                background_tasks.add_task(
                    email_service.send_municipality_welcome_email,
                    to_email=current_user.email,
                    talent_name=current_user.full_name,
                    municipality_name=location.municipality,
                    guide_url=guide_url,
                    contact_email=contact_email
                )
                #Código anterior
                #email_service.send_municipality_welcome_email(
                #    to_email=current_user.email,
                #    talent_name=current_user.full_name,
                #    municipality_name=location.municipality,
                #    guide_url=guide_url,
                #    contact_email=contact_email
                #)
                
                # 2. Notify Municipality (Audit Log / Notification)
                # Find the organization representing this municipality
                muni_org = db.query(models.Organization).filter(
                    models.Organization.location_id == loc_id,
                    models.Organization.org_type == 'municipality'
                ).first()
                
                if muni_org:
                    pseudonym = f"RM-{str(profile.id)[:4].upper()}"
                    event_msg = f"¡Nuevo Compromiso de Mudanza! El candidato {pseudonym} ha confirmado su intención de mudarse a {location.municipality}."
                    
                    db.add(models.AuditLog(
                        organization_id=muni_org.id,
                        event_type="info",
                        message=event_msg,
                        details={
                            "talent_id": str(profile.id),
                            "type": "relocation_commitment",
                            "municipality": location.municipality
                        }
                    ))
        db.commit()

    return profile

@router.get("/me/support-messages", response_model=List[schemas.MunicipalSupportMessage])
def get_my_support_messages(
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    if current_user.role != "talent":
        raise HTTPException(status_code=403, detail="Only talent users can access these messages")
    
    profile = current_user.talent_profile
    if not profile:
        return []
        
    return db.query(models.MunicipalSupportMessage).filter(
        models.MunicipalSupportMessage.talent_profile_id == profile.id
    ).order_by(models.MunicipalSupportMessage.created_at.desc()).all()

@router.post("/me/support-messages/{message_id}/respond")
def respond_to_support_message(
    message_id: uuid.UUID,
    payload: dict, # {"response_type": "A" | "B" | "C", "privacy_consent": bool, "notes": str}
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    if current_user.role != "talent":
        raise HTTPException(status_code=403, detail="Permission denied")
        
    msg = db.query(models.MunicipalSupportMessage).filter(
        models.MunicipalSupportMessage.id == message_id,
        models.MunicipalSupportMessage.talent_profile_id == current_user.talent_profile.id
    ).first()
    
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    response_type = payload.get("response_type")
    # Compatibility with old 'status' payload
    if not response_type:
        status_val = payload.get("status")
        if status_val == "accepted":
            response_type = "A"
        elif status_val == "declined":
            response_type = "C"
        else:
            raise HTTPException(status_code=400, detail="Invalid status or response_type")

    if response_type not in ["A", "B", "C"]:
        raise HTTPException(status_code=400, detail="Invalid response type")
        
    import datetime
    msg.response_type = response_type
    msg.privacy_consent_shared = payload.get("privacy_consent", False)
    msg.response_notes = payload.get("notes")
    
    # Map technical response_type to human status
    if response_type in ["A", "B"]:
        msg.status = "accepted"
        
        # Notify the Municipality
        pseudonym = f"RM-{str(msg.talent_profile_id)[:4].upper()}"
        response_desc = "Interés e Identidad" if response_type == "A" else "Interés Anónimo"
        
        db.add(models.AuditLog(
            organization_id=msg.municipality_id,
            event_type="info",
            message=f"¡Buenas noticias! El Candidato {pseudonym} ha respondido con '{response_desc}' a tu propuesta.",
            details={
                "talent_id": str(msg.talent_profile_id),
                "response_type": response_type,
                "privacy_consent": payload.get("privacy_consent", False)
            }
        ))
    else:
        msg.status = "declined"
        
    msg.responded_at = datetime.datetime.utcnow()
    
    db.commit()
    return {"message": f"Response {response_type} submitted successfully"}
