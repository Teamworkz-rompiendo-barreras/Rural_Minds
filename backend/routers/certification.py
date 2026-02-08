
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import models, auth, database, schemas
import datetime
from utils.seal_service import update_seal_progress, validate_task_by_talent
import uuid

router = APIRouter(
    prefix="/certification",
    tags=["certification"],
)

@router.get("/seal/status", response_model=schemas.EnterpriseSealStatusResponse)
def get_seal_status(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User not associated with an organization")
        
    status = db.query(models.EnterpriseSealStatus).filter(
        models.EnterpriseSealStatus.organization_id == current_user.organization_id
    ).first()
    
    if not status:
        # Return a pending state if not initialized
        return {
            "id": uuid.uuid4(),
            "organization_id": current_user.organization_id,
            "status": "pending",
            "progress_percentage": 0,
            "total_tasks": 0,
            "completed_tasks": 0,
            "last_updated": datetime.datetime.utcnow()
        }
    return status

@router.get("/seal/tasks", response_model=List[schemas.WorkplaceAdjustmentTask])
def get_seal_tasks(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Logic: 
    # If company: get tasks where organization_id = user.org
    # If talent: get tasks where user_id = user.id
    if current_user.role == "enterprise":
        return db.query(models.WorkplaceAdjustmentTask).filter(
            models.WorkplaceAdjustmentTask.organization_id == current_user.organization_id
        ).all()
    elif current_user.role == "talent":
        return db.query(models.WorkplaceAdjustmentTask).filter(
            models.WorkplaceAdjustmentTask.user_id == current_user.id
        ).all()
    else:
        return []

@router.post("/seal/tasks/{task_id}/evidence")
def upload_task_evidence(
    task_id: uuid.UUID,
    evidence_type: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # For MVP we simulate upload by saving a mock URL
    # In production this would use Supabase Storage
    task = db.query(models.WorkplaceAdjustmentTask).filter(
        models.WorkplaceAdjustmentTask.id == task_id,
        models.WorkplaceAdjustmentTask.organization_id == current_user.organization_id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or access denied")
        
    task.evidence_type = evidence_type
    task.evidence_url = f"https://supabase.storage/excellence-evidence/{task_id}_{evidence_type}.jpg"
    task.status = "ready_for_validation"
    
    db.commit()
    return {"status": "ok", "evidence_url": task.evidence_url}

@router.post("/seal/tasks/{task_id}/validate")
def validate_task(
    task_id: uuid.UUID,
    data: schemas.WorkplaceAdjustmentTaskUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "talent":
        raise HTTPException(status_code=403, detail="Only the hired talent can validate adjustments")
        
    task = db.query(models.WorkplaceAdjustmentTask).filter(
        models.WorkplaceAdjustmentTask.id == task_id,
        models.WorkplaceAdjustmentTask.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not assigned to this user")
        
    success = validate_task_by_talent(
        db, 
        task_id, 
        is_accepted=(data.status == "verified"), 
        feedback=data.talent_feedback
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to validate task")
        
    return {"status": "ok"}

@router.post("/verify/submit", response_model=schemas.SensoryVerificationResponse)
def submit_sensory_verification(
    data: schemas.SensoryVerificationCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "talent":
        raise HTTPException(status_code=403, detail="Only the hired talent can submit the cotton test")
    
    # Check if application exists and belongs to user
    app = db.query(models.Application).filter(
        models.Application.id == data.application_id,
        models.Application.user_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found or access denied")
        
    # Create verification
    verification = models.SensoryVerification(
        application_id=data.application_id,
        lighting_feedback=data.lighting_feedback,
        acoustics_feedback=data.acoustics_feedback,
        instructions_feedback=data.instructions_feedback,
        social_feedback=data.social_feedback,
        adjustments_results=data.adjustments_results,
        needs_mediation=data.needs_mediation
    )
    
    db.add(verification)
    
    # Business Logic: Check for issues and determine priority
    negative_adjustment_ids = [tid for tid, val in data.adjustments_results.items() if val == "no"]
    any_issue = any(val in ["no", "adjust"] for val in data.adjustments_results.values())
    no_count = len(negative_adjustment_ids)
    
    if any_issue:
        # Determine priority
        priority = "critical" if no_count > 2 else "moderate"
        
        # Determine category (first point of failure)
        category = "General"
        if negative_adjustment_ids:
            first_fail = db.query(models.WorkplaceAdjustmentTask).get(negative_adjustment_ids[0])
            if first_fail:
                category = first_fail.category.capitalize()
        
        # Create an incident
        incident = models.CertificationIncident(
            organization_id=app.challenge.tenant_id,
            application_id=app.id,
            priority=priority,
            category=category,
            talent_version=f"Feedback 30 días: Iluminación({data.lighting_feedback}), Acústica({data.acoustics_feedback}).",
            status="open"
        )
        db.add(incident)
        
        # Webhook Simulation: Alert soporte Teamworkz if critical
        if priority == "critical":
            print(f"🚨 ALERT: Critical incident for {app.challenge.tenant.name}. Priority High email sent to support@teamworkz.com")
            
    db.commit()
    db.refresh(verification)
    return verification

@router.get("/verify/incidents", response_model=List[schemas.CertificationIncidentResponse])
def get_certification_incidents(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Only superadmins can see ALL incidents
    if current_user.role == "super_admin":
        return db.query(models.CertificationIncident).all()
        
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User not associated with an organization")
        
    return db.query(models.CertificationIncident).filter(
        models.CertificationIncident.organization_id == current_user.organization_id
    ).all()

@router.post("/verify/trigger-cotton-test")
def trigger_cotton_test(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "super_admin":
         raise HTTPException(status_code=403, detail="Only super admins can trigger mass notifications")
         
    thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    
    pending_apps = db.query(models.Application).filter(
        models.Application.status == "hired",
        models.Application.hiring_start_date <= thirty_days_ago,
        models.Application.is_verification_sent == False
    ).all()
    
    count = 0
    for app in pending_apps:
        app.is_verification_sent = True
        
        notification = models.AuditLog(
            id=uuid.uuid4(),
            user_id=app.user_id,
            event_type="cotton_test_pending",
            message=f"¿Cómo te va en {app.challenge.tenant.name}? Cuéntanos tu primer mes.",
            details={
                "application_id": str(app.id),
                "type": "verification_sheet",
                "url": f"/verify-sensory/{app.id}"
            }
        )
        db.add(notification)
        count += 1
        
    db.commit()
    return {"status": "ok", "notifications_sent": count}
