
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, auth, database
from datetime import datetime

router = APIRouter(
    tags=["messages"],
)

@router.get("/api/applications/{application_id}/messages", response_model=List[schemas.Message])
def get_messages(
    application_id: str,
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Valid security: User must be the talent OR the challenge owner (enterprise)
    is_talent = application.user_id == current_user.id
    is_employer = application.challenge.creator_id == current_user.id
    
    if not (is_talent or is_employer):
        raise HTTPException(status_code=403, detail="Not authorized to view messages")

    # Order by timestamp
    return db.query(models.Message).filter(models.Message.application_id == application_id).order_by(models.Message.created_at).all()

@router.post("/api/applications/{application_id}/messages", response_model=schemas.Message)
def send_message(
    application_id: str,
    message_data: schemas.MessageCreate,
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Valid security check
    is_talent = application.user_id == current_user.id
    is_employer = application.challenge.creator_id == current_user.id
    
    if not (is_talent or is_employer):
        raise HTTPException(status_code=403, detail="Not authorized to join this conversation")
        
    # Optional: Check if application is active (not rejected/closed)?
    # Keeping it open even if rejected for feedback, unless specified otherwise.
    # Request says: "Si la postulación se rechaza... el chat se archiva".
    # Implementing soft block for now?
    # if application.status == "rejected":
    #    raise HTTPException(status_code=400, detail="Conversation archived")

    new_message = models.Message(
        application_id=application_id,
        sender_id=current_user.id,
        content=message_data.content,
        message_type=message_data.message_type,
        attachment_url=message_data.attachment_url,
        attachment_label=message_data.attachment_label
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message
