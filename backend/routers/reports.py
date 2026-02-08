from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, PlainTextResponse
from sqlalchemy.orm import Session
import models, auth, database, schemas
from utils.pdf_generator import generate_impact_report_pdf, generate_impact_report_txt
from utils.pdf_monthly_generator import generate_monthly_report_pdf
from utils.email_service import send_monthly_report_email
from datetime import datetime, timedelta
from sqlalchemy import func
import uuid

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

def get_monthly_impact_data(db: Session, municipality_id: str):
    # Determine date range (current month)
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    
    # Or for testing, use last 30 days
    # month_start = now - timedelta(days=30)
    
    # 1. Total Interested (Applications for projects in this municipality)
    org_ids = [o[0] for o in db.query(models.Organization.id).filter(models.Organization.municipality_id == municipality_id).all()]
    org_ids.append(municipality_id)
    
    app_query = db.query(models.Application).join(models.Challenge).filter(
        models.Challenge.tenant_id.in_(org_ids),
        models.Application.created_at >= month_start
    )
    
    total_interested = app_query.count()
    num_attraction = app_query.filter(models.Application.willing_to_relocate == True).count()
    num_rooting = total_interested - num_attraction
    
    # 2. Consults (Relocation Leads)
    num_consults = db.query(models.RelocationLead).filter(
        models.RelocationLead.municipality_id == municipality_id,
        models.RelocationLead.created_at >= month_start
    ).count()
    
    # 3. Matches (Accepted)
    num_matches = app_query.filter(models.Application.status == 'accepted').count()
    
    # 4. Origins Breakdown
    leads = db.query(models.RelocationLead.origin_province).filter(
        models.RelocationLead.municipality_id == municipality_id,
        models.RelocationLead.created_at >= month_start
    ).all()
    
    origin_counts = {"Madrid": 0, "Barcelona": 0, "Otras": 0, "Intl": 0}
    for (prov,) in leads:
        if not prov: continue
        if "Madrid" in prov: origin_counts["Madrid"] += 1
        elif "Barcelona" in prov: origin_counts["Barcelona"] += 1
        else: origin_counts["Otras"] += 1
        
    # Normalize or use absolute (PDF generator expects percentages or counts? I used absolute in drawing)
    # Actually create_pie_chart expects a list. I'll pass a dict.
    
    # 5. Sensory Diagnosis (Mocked based on leads or profiles)
    # In a real app we'd aggregate sensory_requirement_highlight or Profile traits
    sensory = {"silence": 75, "light": 60}
    
    # 6. Top Companies
    top_companies_raw = db.query(
        models.Organization.name, 
        func.count(models.Application.id).label('app_count'),
        models.Organization.org_type
    ).join(models.Challenge, models.Organization.id == models.Challenge.tenant_id)\
     .join(models.Application, models.Challenge.id == models.Application.challenge_id)\
     .filter(models.Organization.municipality_id == municipality_id)\
     .group_by(models.Organization.id)\
     .order_by(func.count(models.Application.id).desc())\
     .limit(2).all()
     
    top_companies = []
    for name, count, otype in top_companies_raw:
        top_companies.append({
            "name": name,
            "offers": count,
            "seal": "Sello de Excelencia" if count > 5 else "Sello de Empresa Local"
        })
    
    # Fallback if empty
    if not top_companies:
        top_companies = [{"name": "Sin empresas activas", "offers": 0, "seal": "N/A"}]

    return {
        "month": now.strftime("%B"),
        "total_interested": total_interested,
        "num_attraction": num_attraction,
        "num_rooting": num_rooting,
        "num_consults": num_consults,
        "num_matches": num_matches,
        "origins": origin_counts if sum(origin_counts.values()) > 0 else {"N/A": 1},
        "sensory": sensory,
        "suggestion": "Vuestro municipio es percibido como un refugio de calma. Potenciar las zonas verdes en la comunicación aumentará el interés.",
        "top_companies": top_companies
    }

@router.get("/trigger-monthly")
def trigger_monthly_reports(db: Session = Depends(database.get_db), secret: str = None):
    # Simple secret check (ideally use a real token for CRON)
    # if secret != os.getenv("CRON_SECRET"):
    #    raise HTTPException(status_code=403)
    
    municipalities = db.query(models.Organization).filter(models.Organization.org_type == 'municipality').all()
    count = 0
    
    for muni in municipalities:
        # Get ADL contact or municipality user
        user = db.query(models.User).filter(models.User.organization_id == muni.id).first()
        if not user: continue
        
        data = get_monthly_impact_data(db, muni.id)
        pdf_bytes = generate_monthly_report_pdf(muni.name, data)
        
        success = send_monthly_report_email(
            to_email=user.email,
            municipality_name=muni.name,
            month_name=data['month'],
            pdf_content=pdf_bytes
        )
        if success:
            count += 1
            
    return {"status": "ok", "reports_sent": count}
