from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth, database

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
        status="pending"
    )
    
    db.add(new_application)
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
        
    return challenge.applications

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
    if new_status not in ["pending", "accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    application.status = new_status
    db.commit()
    db.refresh(application)
    
    return application
