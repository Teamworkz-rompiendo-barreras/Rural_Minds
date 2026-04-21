from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import models, schemas, auth, database
import uuid

router = APIRouter(
    prefix="/api/talent",
    tags=["talent"],
)

@router.get("/dashboard")
def get_talent_dashboard(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != "talent":
        raise HTTPException(status_code=403, detail="Only talent users can access this dashboard")
    
    # 1. Applications (Processes)
    apps = db.query(models.Application).filter(models.Application.user_id == current_user.id).all()
    enriched_apps = []
    for app in apps:
        enriched_apps.append({
            "id": str(app.id),
            "status": app.status,
            "created_at": app.created_at,
            "challenge": {
                "id": str(app.challenge.id),
                "title": app.challenge.title,
                "tenant": {
                    "name": app.challenge.tenant.name if app.challenge.tenant else "Empresa Rural"
                }
            }
        })
    
    # 2. Favorite Municipalities (Target Locations)
    profile = current_user.talent_profile
    favorites = []
    if profile and profile.target_locations:
        try:
            loc_ids = [uuid.UUID(lid) if isinstance(lid, str) else lid for lid in profile.target_locations]
            locations = db.query(models.Location).filter(models.Location.id.in_(loc_ids)).all()
            
            for loc in locations:
                details = db.query(models.MunicipalityDetails).filter(models.MunicipalityDetails.location_id == loc.id).first()
                favorites.append({
                    "id": str(loc.id),
                    "municipality": loc.municipality,
                    "province": loc.province,
                    "gallery_urls": details.gallery_urls if details else [],
                    "internet_speed": details.internet_speed if details else None,
                    "average_climate": details.average_climate if details else None
                })
        except:
            pass
    #Código añadido por Andrés Barcenilla 21-04-2026
    profile_data = None
    if profile:
        profile_data = {
            "id": str(profile.id),
            "bio": profile.bio,
            "skills": profile.skills or [],
            "preferences": profile.preferences or {},
            "neurodivergent_traits": profile.neurodivergent_traits or [],
            "work_style": profile.work_style,
            "communication_preferences": profile.communication_preferences or {},
            "residence_location_id": str(profile.residence_location_id) if profile.residence_location_id else None,
            "residence_international": profile.residence_international,
            "is_willing_to_move": profile.is_willing_to_move,
            "target_locations": profile.target_locations or [],
            "relocation_commitment": profile.relocation_commitment,
            "visibility_settings": profile.visibility_settings or {},
            "achievements": profile.achievements or [],
        }
    return {
        "applications": enriched_apps,
        "favorites": favorites,
        #profile_data es un diccionario creado manualmente para evitar errores
        "profile": profile_data,
        "achievements": profile.achievements if profile else [],
        "notification_settings": current_user.notification_settings
    }

@router.get("/inbox")
def get_talent_inbox(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != "talent":
        raise HTTPException(status_code=403, detail="Only talent users can access this inbox")
    
    # Conversations from Applications
    apps = db.query(models.Application).filter(models.Application.user_id == current_user.id).all()
    app_convs = []
    for app in apps:
        last_msg = db.query(models.Message).filter(models.Message.application_id == app.id).order_by(models.Message.created_at.desc()).first()
        app_convs.append({
            "id": str(app.id),
            "type": "application",
            "title": app.challenge.title,
            "entity": app.challenge.tenant.name if app.challenge.tenant else "Empresa Rural",
            "status": app.status,
            "last_message": last_msg.content if last_msg else "Sin mensajes aún",
            "last_message_at": last_msg.created_at if last_msg else app.created_at,
            "unread_count": db.query(models.Message).filter(models.Message.application_id == app.id, models.Message.is_read == False, models.Message.sender_id != current_user.id).count()
        })
    
    # Conversations from Municipal Support
    profile = current_user.talent_profile
    support_convs = []
    if profile:
        support_msgs = db.query(models.MunicipalSupportMessage).filter(models.MunicipalSupportMessage.talent_profile_id == profile.id).all()
        for msg in support_msgs:
            support_convs.append({
                "id": str(msg.id),
                "type": "support",
                "title": "Propuesta de Acogida",
                "entity": msg.municipality.name if msg.municipality else "Ayuntamiento",
                "status": msg.status,
                "last_message": msg.content[:50] + "...",
                "last_message_at": msg.created_at,
                "unread_count": 0 if msg.status != "sent" else 1
            })
        
    all_convs = app_convs + support_convs
    all_convs.sort(key=lambda x: x["last_message_at"], reverse=True)
    
    return all_convs

@router.put("/profile/visibility")
def update_visibility(
    payload: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    profile = current_user.talent_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    profile.visibility_settings = payload
    db.commit()
    return {"status": "updated", "visibility_settings": profile.visibility_settings}

@router.put("/notifications")
def update_notifications(
    payload: dict,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    current_user.notification_settings = payload
    db.commit()
    return {"status": "updated", "notification_settings": current_user.notification_settings}
