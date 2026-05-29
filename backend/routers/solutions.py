from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

import models, schemas, auth, database
import uuid
import datetime

router = APIRouter(
    prefix="/accessibility",
    tags=["solutions"],
)

DEFAULT_SOLUTIONS = [
    {"title": "Iluminación Adaptativa", "description": "Ajuste de temperatura de color y nivel de brillo en el puesto de trabajo para reducir la fatiga visual y la hipersensibilidad lumínica.", "category": "environment", "impact_level": "alto", "cost_estimate": "50-200€"},
    {"title": "Software de Texto a Voz", "description": "Herramientas como NaturalReader o Microsoft Immersive Reader que verbalizan texto en pantalla, facilitando la comprensión para personas con dislexia o procesamiento visual.", "category": "software", "impact_level": "alto", "cost_estimate": "0-15€/mes"},
    {"title": "Auriculares con Cancelación de Ruido", "description": "Dispositivos que bloquean el ruido ambiental de la oficina, esenciales para personas con hipersensibilidad auditiva o TDAH.", "category": "hardware", "impact_level": "alto", "cost_estimate": "80-350€"},
    {"title": "Protocolo de Comunicación Asíncrona", "description": "Definición de normas de equipo que priorizan mensajes escritos sobre llamadas imprevistas, reduciendo la ansiedad por comunicación.", "category": "protocol", "impact_level": "medio", "cost_estimate": "0€"},
    {"title": "Monitor con Filtro de Luz Azul", "description": "Pantallas o filtros físicos que reducen la emisión de luz azul, mejorando el bienestar visual y el ritmo circadiano.", "category": "hardware", "impact_level": "medio", "cost_estimate": "20-150€"},
    {"title": "Aplicación de Gestión de Tareas Visual", "description": "Herramientas como Trello o Notion con vistas Kanban que externalizan la carga cognitiva y facilitan la planificación para perfiles con TDAH.", "category": "software", "impact_level": "alto", "cost_estimate": "0-10€/mes"},
    {"title": "Zona de Descanso Sensorial", "description": "Espacio físico tranquilo y con estímulos reducidos donde el empleado puede autorregularse durante la jornada laboral.", "category": "environment", "impact_level": "alto", "cost_estimate": "200-1000€"},
    {"title": "Agenda de Reuniones Anticipada", "description": "Protocolo que exige enviar el orden del día 24h antes de cualquier reunión, permitiendo la preparación cognitiva y reduciendo la incertidumbre.", "category": "protocol", "impact_level": "medio", "cost_estimate": "0€"},
]

@router.get("/adjustments/catalog", response_model=List[schemas.Solution])
def list_adjustments_catalog(db: Session = Depends(database.get_db)):
    solutions = read_solutions(db=db)
    if not solutions:
        # Auto-seed default solutions on first access
        for sol in DEFAULT_SOLUTIONS:
            db_sol = models.Solution(**sol)
            db.add(db_sol)
        db.commit()
        solutions = read_solutions(db=db)
    return solutions

# --- Lifecycle Endpoints ---

class AdjustmentRequest(schemas.BaseModel):
    solution_title: str
    notes: Optional[str] = None

class FeedbackRequest(schemas.BaseModel):
    score: float
    notes: Optional[str] = None

@router.post("/adjustments/request")
def request_adjustment(
    req: AdjustmentRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    log = models.AdjustmentsLog(
        id=uuid.uuid4(),
        organization_id=current_user.organization_id if current_user.organization_id else None,
        user_id=current_user.id,
        adjustment_type=req.solution_title,
        status="requested",
        notes=req.notes
    )
    db.add(log)
    db.commit()
    return {"message": "Adjustment requested", "id": str(log.id)}

@router.post("/adjustments/{log_id}/feedback")
def submit_feedback(
    log_id: uuid.UUID,
    feedback: FeedbackRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    log = db.query(models.AdjustmentsLog).filter(models.AdjustmentsLog.id == log_id).first()
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Adjustment log not found")
        
    log.feedback_score = feedback.score
    log.feedback_date = datetime.datetime.utcnow()
    log.notes = feedback.notes
    db.commit()
    return {"message": "Feedback recorded"}

@router.get("/adjustments/mine")
def list_my_adjustments(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.AdjustmentsLog).filter(models.AdjustmentsLog.user_id == current_user.id).all()


@router.get("/", response_model=List[schemas.Solution])
def read_solutions(category: Optional[str] = None, db: Session = Depends(database.get_db)):
    query = db.query(models.Solution)
    if category:
        query = query.filter(models.Solution.category == category)
    return query.all()

@router.post("/", response_model=schemas.Solution)
def create_solution(solution: schemas.SolutionCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Only Admin/Enterprise can suggest/add solutions? For MVP letting any auth user add for demo population
    # Or restrict to super_admin
    # if current_user.role != "super_admin": ...
    
    db_solution = models.Solution(**solution.model_dump())
    db.add(db_solution)
    db.commit()
    db.refresh(db_solution)
    return db_solution
