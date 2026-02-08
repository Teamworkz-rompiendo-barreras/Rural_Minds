from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth, database
import uuid
from models_location import Location

router = APIRouter(
    tags=["applications"],
)

@router.post("/api/applications", response_model=schemas.Application)
def create_application(
    application_data: dict, # Using dict to extract fields manually or adapt checks
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    # This endpoint replaces the old /api/challenges/{id}/apply
    challenge_id = application_data.get("challenge_id")
    cover_letter = application_data.get("cover_letter")
    willing_to_relocate = application_data.get("willing_to_relocate", False)
    
    if not challenge_id:
        raise HTTPException(status_code=400, detail="Challenge ID required")

    if current_user.role != "talent":
        raise HTTPException(status_code=403, detail="Only talents can apply to challenges")

    # Check if challenge exists
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Check if already applied
    existing_application = db.query(models.Application).filter(
        models.Application.challenge_id == challenge_id,
        models.Application.user_id == current_user.id
    ).first()
    
    if existing_application:
        raise HTTPException(status_code=400, detail="You have already applied to this challenge")

    new_application = models.Application(
        user_id=current_user.id,
        challenge_id=challenge_id,
        cover_letter=cover_letter,
        willing_to_relocate=willing_to_relocate,
        status="pending"
    )
    
    db.add(new_application)
    db.flush() # Ensure new_application.id is available

    # --- Trigger Notification & Lead to Municipality if relocation is checked ---
    if willing_to_relocate:
        org = db.query(models.Organization).get(challenge.tenant_id)
        if org and org.municipality_id:
            # 1. Fetch Talent Context
            talent_profile = db.query(models.TalentProfile).filter(models.TalentProfile.user_id == current_user.id).first()
            acc_profile = db.query(models.AccessibilityProfile).filter(models.AccessibilityProfile.user_id == current_user.id).first()
            
            origin_city = "Desconocida"
            origin_province = "Desconocida"
            if talent_profile and talent_profile.residence_location_id:
                loc = db.query(Location).get(talent_profile.residence_location_id)
                if loc:
                    origin_city = loc.municipality
                    origin_province = loc.province
            
            # 2. Fetch Highlight Sensory Need
            sensory_highlight = "No especificado"
            if acc_profile and acc_profile.sensory_needs:
                needs = acc_profile.sensory_needs
                if needs.get("noise") == "high": sensory_highlight = "Entorno silencioso"
                elif needs.get("light") == "high": sensory_highlight = "Baja luminosidad"
                elif needs.get("communication") == "async": sensory_highlight = "Comunicación asíncrona"

            # 3. Create Relocation Lead (Lead data for metrics & dashboard)
            lead = models.RelocationLead(
                id=uuid.uuid4(),
                application_id=new_application.id,
                talent_id=current_user.id,
                municipality_id=org.municipality_id,
                origin_city=origin_city,
                origin_province=origin_province,
                target_municipality=challenge.tenant.location.municipality if challenge.tenant and challenge.tenant.location else "Este municipio",
                sensory_requirement_highlight=sensory_highlight,
                status="new"
            )
            db.add(lead)

            # 4. Rich Notification (AuditLog)
            notification_msg = f"Aspirante a Residente: {current_user.full_name or 'Talento'}"
            notification = models.AuditLog(
                id=uuid.uuid4(),
                organization_id=org.municipality_id,
                user_id=current_user.id,
                event_type="info",
                message=notification_msg,
                details={
                    "talent_name": current_user.full_name,
                    "challenge_title": challenge.title,
                    "application_id": str(new_application.id),
                    "lead_id": str(lead.id),
                    "origin": f"{origin_city}, {origin_province}",
                    "reason": "Interés en oferta y compromiso de mudanza",
                    "sensory_need": sensory_highlight,
                    "is_relocation_lead": True
                }
            )
            db.add(notification)
            print(f"🔔 RELOCATION LEAD CREATED: {current_user.email} -> {lead.target_municipality}")

    db.commit()
    db.refresh(new_application)
    return new_application

@router.get("/api/applications/me", response_model=List[schemas.Application])
def get_my_applications(
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    if current_user.role != "talent":
        raise HTTPException(status_code=403, detail="Only talents can view their applications")
    
    return current_user.applications

@router.get("/api/challenges/{challenge_id}/applications", response_model=List[schemas.Application])
def get_challenge_applications(
    challenge_id: str,
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    # Check challenge exists
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    # Only the creator (enterprise) or super admin can view applications
    if challenge.creator_id != current_user.id and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized to view applications for this challenge")
        
    # Calculate is_local for each application
    apps = challenge.applications
    org = db.query(models.Organization).get(challenge.tenant_id)
    
    for app in apps:
        talent_profile = db.query(models.TalentProfile).filter(models.TalentProfile.user_id == app.user_id).first()
        if talent_profile:
            if org and org.location_id and talent_profile.residence_location_id:
                muni_loc = db.query(Location).filter(Location.id == org.location_id).first()
                talent_loc = db.query(Location).filter(Location.id == talent_profile.residence_location_id).first()
                if muni_loc and talent_loc:
                    app.is_local = muni_loc.municipality == talent_loc.municipality
                    
                    # Calculate Location Label
                    if app.is_local:
                        app.location_label = "KM 0 / Arraigo"
                    elif app.willing_to_relocate:
                        app.location_label = "Atracción / Mudanza"
                    else:
                        app.location_label = "Remoto / Pendiente"
                else:
                    app.is_local = False
                    app.location_label = "Atracción / Mudanza" if app.willing_to_relocate else "Remoto"
            else:
                app.is_local = False
                app.location_label = "Atracción / Mudanza" if app.willing_to_relocate else "Remoto"
        else:
            app.is_local = False
            app.location_label = "Remoto"

    return apps

@router.put("/api/applications/{application_id}/status", response_model=schemas.Application)
def update_application_status(
    application_id: str,
    status_update: dict, # Expecting {"status": "accepted" | "rejected"}
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Verify ownership (Enterprise who created the challenge)
    if application.challenge.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this application")
        
    new_status = status_update.get("status")
    if new_status not in ["pending", "accepted", "rejected", "hired"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    previous_status = application.status
    application.status = new_status
    
    if new_status == "hired" and previous_status != "hired":
        import datetime
        application.hiring_start_date = datetime.datetime.utcnow()
        
    db.commit()
    db.refresh(application)
    
    # --- Trigger Onboarding Flow if Accepted ---
    if new_status == "accepted" and previous_status != "accepted":
        # 1. Generate Tasks
        # "Prepara el entorno físico", "Protocolo de bienvenida", "Informa al equipo"
        tasks = [
            models.OnboardingTask(application_id=application.id, task_text="Preparar entorno físico (luz, ruido, ubicación)"),
            models.OnboardingTask(application_id=application.id, task_text="Establecer protocolo de bienvenida y comunicación"),
            models.OnboardingTask(application_id=application.id, task_text="Informar al equipo sobre ajustes necesarios")
        ]
        db.add_all(tasks)
        db.commit()
        
        # 3. Generate Excellence Seal Tasks (Workplace Adjustments)
        from utils.seal_service import generate_tasks_from_profile
        try:
            generate_tasks_from_profile(db, application.id)
            print(f"🏅 EXCELLENCE SEAL TASKS GENERATED for application {application.id}")
        except Exception as e:
            print(f"⚠️ Error generating seal tasks: {e}")
        
        # 2. (Mock) Trigger Notification logic here if needed
        # print(f"Notification: Match Accepted for {application.id}")

    return application
