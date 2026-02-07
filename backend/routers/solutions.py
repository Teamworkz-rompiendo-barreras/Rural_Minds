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

@router.get("/adjustments/catalog", response_model=List[schemas.Solution]) 
def list_adjustments_catalog(db: Session = Depends(database.get_db)):
    return read_solutions(db=db)

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
