
from sqlalchemy.orm import Session
import models
import uuid
from datetime import datetime

# Mapping of sensory needs to workplace tasks
SENSORY_TASK_MAPPING = {
    "lighting_sensitivity": [
        {"desc": "Instalar filtros de luz o reguladores en el puesto de trabajo", "cat": "lighting"},
        {"desc": "Proporcionar flexo con temperatura de color regulable", "cat": "lighting"}
    ],
    "noise_sensitivity": [
        {"desc": "Instalar paneles fonoabsorbentes o divisorios acústicos", "cat": "noise"},
        {"desc": "Proporcionar auriculares con cancelación de ruido", "cat": "noise"}
    ],
    "preference_easy_read": [
        {"desc": "Adaptar el manual de bienvenida a Lectura Fácil", "cat": "communication"},
        {"desc": "Simplificar señalética de la oficina con pictogramas", "cat": "communication"}
    ],
    "movement_sensitivity": [
        {"desc": "Ubicar el puesto de trabajo en zona de bajo tránsito", "cat": "physical"}
    ],
    "smell_sensitivity": [
        {"desc": "Garantizar entorno libre de fragancias intensas/limpieza neutra", "cat": "physical"}
    ]
}

def generate_tasks_from_profile(db: Session, application_id: uuid.UUID):
    """
    Generates specific adjustment tasks based on the talent's sensory profile.
    Activated when a match is confirmed.
    """
    app = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not app:
        return None
    
    talent_profile = db.query(models.AccessibilityProfile).filter(models.AccessibilityProfile.user_id == app.user_id).first()
    if not talent_profile or not talent_profile.sensory_needs:
        return []

    challenge = db.query(models.Challenge).filter(models.Challenge.id == app.challenge_id).first()
    if not challenge:
        return []

    org_id = challenge.tenant_id
    needs = talent_profile.sensory_needs # e.g. {"lighting_sensitivity": True, "noise_sensitivity": False}
    
    created_tasks = []
    
    for need_key, is_active in needs.items():
        if is_active and need_key in SENSORY_TASK_MAPPING:
            for task_data in SENSORY_TASK_MAPPING[need_key]:
                # Check for duplicates to avoid re-adding if already generated
                exists = db.query(models.WorkplaceAdjustmentTask).filter(
                    models.WorkplaceAdjustmentTask.application_id == application_id,
                    models.WorkplaceAdjustmentTask.task_description == task_data["desc"]
                ).first()
                
                if not exists:
                    new_task = models.WorkplaceAdjustmentTask(
                        id=uuid.uuid4(),
                        organization_id=org_id,
                        user_id=app.user_id,
                        application_id=application_id,
                        task_description=task_data["desc"],
                        category=task_data["cat"],
                        status="pending"
                    )
                    db.add(new_task)
                    created_tasks.append(new_task)
    
    if created_tasks:
        # Initialize or update EnterpriseSealStatus
        seal_status = db.query(models.EnterpriseSealStatus).filter(models.EnterpriseSealStatus.organization_id == org_id).first()
        if not seal_status:
            seal_status = models.EnterpriseSealStatus(
                id=uuid.uuid4(),
                organization_id=org_id,
                status="pending"
            )
            db.add(seal_status)
        
        db.commit()
        update_seal_progress(db, org_id)
        
    return created_tasks

def update_seal_progress(db: Session, organization_id: uuid.UUID):
    """
    Recalculates progress percentage based on tasks.
    """
    tasks = db.query(models.WorkplaceAdjustmentTask).filter(models.WorkplaceAdjustmentTask.organization_id == organization_id).all()
    if not tasks:
        return
    
    total = len(tasks)
    completed = len([t for t in tasks if t.status == "verified"])
    
    seal_status = db.query(models.EnterpriseSealStatus).filter(models.EnterpriseSealStatus.organization_id == organization_id).first()
    if seal_status:
        seal_status.total_tasks = total
        seal_status.completed_tasks = completed
        seal_status.progress_percentage = int((completed / total) * 100) if total > 0 else 0
        
        if seal_status.progress_percentage == 100:
            # BLOQUEO DE CERTIFICACIÓN: Check for open incidents
            open_incidents = db.query(models.CertificationIncident).filter(
                models.CertificationIncident.organization_id == organization_id,
                models.CertificationIncident.status.in_(["open", "in_mediation", "seal_paused"])
            ).first()
            
            if open_incidents:
                seal_status.status = "seal_paused"
                print(f"⚠️ SEAL BLOCKED: Organization {organization_id} has open incidents.")
            else:
                seal_status.status = "verified"
                # Update the Organization to show the seal publicly
                org = db.query(models.Organization).filter(models.Organization.id == organization_id).first()
                if org:
                    org.has_excellence_seal = True
                    org.seal_metadata["last_validated"] = datetime.utcnow().isoformat()
        else:
            seal_status.status = "in_progress"
            
        db.commit()

def validate_task_by_talent(db: Session, task_id: uuid.UUID, is_accepted: bool, feedback: str = None):
    """
    Talent confirms or rejects a workplace adjustment.
    """
    task = db.query(models.WorkplaceAdjustmentTask).filter(models.WorkplaceAdjustmentTask.id == task_id).first()
    if not task:
        return False
        
    if is_accepted:
        task.status = "verified"
        task.verified_at = datetime.utcnow()
    else:
        task.status = "rejected"
        
    task.talent_feedback = feedback
    db.commit()
    
    update_seal_progress(db, task.organization_id)
    return True
