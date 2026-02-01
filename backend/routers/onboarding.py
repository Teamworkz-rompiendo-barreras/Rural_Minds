from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import datetime
import models, schemas, auth, database

router = APIRouter(
    tags=["onboarding"],
)

@router.get("/api/applications/{application_id}/tasks", response_model=List[schemas.OnboardingTask])
def get_onboarding_tasks(
    application_id: str,
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    # Verify application exists
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Security: Only Tenant (Creator) or Talent (Applicant) can view tasks?
    # Request says "Company View (Roadmap)". Talent views success message.
    # We'll allow both for flexibility, but primary user is Company.
    
    # Ownership Check
    is_creator = application.challenge.creator_id == current_user.id
    is_applicant = application.user_id == current_user.id
    
    if not (is_creator or is_applicant or current_user.role == "super_admin"):
         raise HTTPException(status_code=403, detail="Not authorized")

    return application.onboarding_tasks

@router.put("/api/tasks/{task_id}", response_model=schemas.OnboardingTask)
def update_task_status(
    task_id: str,
    task_update: schemas.OnboardingTaskUpdate,
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    task = db.query(models.OnboardingTask).filter(models.OnboardingTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # Only Company (creator of challenge) should update tasks?
    # application -> challenge -> creator_id
    if task.application.challenge.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the company can update onboarding tasks")
        
    task.is_completed = task_update.is_completed
    if task.is_completed:
        task.completed_at = datetime.datetime.utcnow()
    else:
        task.completed_at = None
        
    db.commit()
    db.refresh(task)
    return task
