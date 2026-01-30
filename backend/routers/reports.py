from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, PlainTextResponse
from sqlalchemy.orm import Session
import models, auth, database, schemas
from utils.pdf_generator import generate_impact_report_pdf, generate_impact_report_txt
from routers import analytics # To reuse data logic if possible, or we re-implement

router = APIRouter(
    prefix="/reports",
    tags=["reports"],
)

def get_impact_data(db: Session, org_id: str):
    # Re-implementing logic from analytics.py for data consistency
    # 1. Basics
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        return None, {}
        
    total_users = db.query(models.User).filter(models.User.organization_id == org_id).count()
    active_profiles = db.query(models.AccessibilityProfile).join(models.User).filter(models.User.organization_id == org_id).count()
    activation_rate = int((active_profiles / total_users * 100) if total_users > 0 else 0)

    total_adjustments = db.query(models.AdjustmentsLog).filter(models.AdjustmentsLog.organization_id == org_id).count()
    implemented_adjustments = db.query(models.AdjustmentsLog).filter(
        models.AdjustmentsLog.organization_id == org_id, 
        models.AdjustmentsLog.status == 'implemented'
    ).count()
    adequacy_index = int((implemented_adjustments / total_adjustments * 100) if total_adjustments > 0 else 0)

    feedbacks = db.query(models.AdjustmentsLog.feedback_score).filter(
        models.AdjustmentsLog.organization_id == org_id, 
        models.AdjustmentsLog.feedback_score.isnot(None)
    ).all()
    avg_wellbeing = sum([f[0] for f in feedbacks]) / len(feedbacks) if feedbacks else 0
    
    inclusion_score = int(activation_rate * 0.4 + adequacy_index * 0.6)
    roi = implemented_adjustments * 500 * 12 
    
    brand_setup_completed = (org.branding_logo_url is not None and "teamworkz" not in org.branding_logo_url.lower())
    
    metrics = {
        "inclusion_score": inclusion_score,
        "adequacy_index": f"{adequacy_index}%",
        "wellbeing_level": round(avg_wellbeing, 1),
        "activation_rate": f"{activation_rate}%",
        "roi_estimated": f"${roi:,}",
        "retention_rate": "94%", # Mocked
        "activation_metrics": {
            "brand_setup": brand_setup_completed,
            "sensory_adoption": activation_rate,
            "accessibility_health": adequacy_index,
            "learning_usage": 12 
        }
    }
    return org, metrics

@router.get("/impact/download/pdf")
def download_impact_report_pdf(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User does not belong to an organization")
        
    org, metrics = get_impact_data(db, current_user.organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    pdf_buffer = generate_impact_report_pdf(org.name, metrics)
    
    filename = f"twz_reporte_impacto_{org.name.replace(' ', '_')}_{pdf_buffer.getbuffer().nbytes}.pdf"
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/impact/download/txt")
def download_impact_report_txt(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User does not belong to an organization")
        
    org, metrics = get_impact_data(db, current_user.organization_id)
    
    content = generate_impact_report_txt(org.name, metrics)
    filename = f"twz_reporte_impacto_{org.name.replace(' ', '_')}.txt"
    
    return PlainTextResponse(
        content,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
