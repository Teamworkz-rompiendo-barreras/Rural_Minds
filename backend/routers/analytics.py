from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

import models, auth, database

router = APIRouter(
    prefix="/stats",
    tags=["analytics"],
)

@router.get("/engagement")
def get_engagement_stats(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # Mocked engagement metrics
    return {
        "monthly_active_users": 15,
        "daily_logins": 45,
        "retention_30_days": "94%",
        "feature_usage": {
            "sensory_profile": "85%",
            "learning_center": "60%"
        }
    }

@router.get("/impact")
def get_impact_report(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user_optional)
):
    # Handle Public/Demo Access (No User)
    if not current_user:
        return {
            "inclusion_score": 88,
            "adequacy_index": "82%",
            "wellbeing_level": 8.5,
            "activation_rate": "70%",
            "roi_estimated": "50.000€",
            "neurodivergent_hires": 150,
            "retention_rate": "95%",
            "hiring_velocity": "12 días",
            "activation_metrics": {
                "brand_setup": True,
                "sensory_adoption": 70,
                "accessibility_health": 85,
                "learning_usage": 450
            }
        }

    org_id = current_user.organization_id
    if not org_id:
        # Return empty/default if no organization context
        return {
            "inclusion_score": 0,
            "retention_rate": "N/A",
            "hiring_velocity": "N/A",
            "roi_estimated": "0€"
        }

    # Determine scope: Single Org or Municipality Aggregation
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    is_municipality = org.org_type == 'municipality' if org else False

    # Base Filter
    if is_municipality:
        # Get all child orgs + self
        child_orgs = db.query(models.Organization.id).filter(models.Organization.municipality_id == org_id).all()
        org_ids = [o[0] for o in child_orgs] + [org_id]
        
        # Filters
        user_filter = models.User.organization_id.in_(org_ids)
        log_filter = models.AdjustmentsLog.organization_id.in_(org_ids)
    else:
        user_filter = models.User.organization_id == org_id
        log_filter = models.AdjustmentsLog.organization_id == org_id

    # 1. Activation Rate: Users with Accessibility Profile / Total Users
    total_users = db.query(models.User).filter(user_filter).count()
    active_profiles = db.query(models.AccessibilityProfile).join(models.User).filter(user_filter).count()
    activation_rate = int((active_profiles / total_users * 100) if total_users > 0 else 0)

    # 2. Adequacy Index: Implemented Adjustments / Requested Adjustments
    total_adjustments = db.query(models.AdjustmentsLog).filter(log_filter).count()
    implemented_adjustments = db.query(models.AdjustmentsLog).filter(
        log_filter, 
        models.AdjustmentsLog.status == 'implemented'
    ).count()
    adequacy_index = int((implemented_adjustments / total_adjustments * 100) if total_adjustments > 0 else 0)

    # 3. Well-being Level: Average feedback score
    feedbacks = db.query(models.AdjustmentsLog.feedback_score).filter(
        log_filter, 
        models.AdjustmentsLog.feedback_score.isnot(None)
    ).all()
    avg_wellbeing = sum([f[0] for f in feedbacks]) / len(feedbacks) if feedbacks else 0
    
    # 4. Inclusion Score (Composite KPI)
    # Weighted average: 40% Activation + 60% Adequacy
    inclusion_score = int(activation_rate * 0.4 + adequacy_index * 0.6)

    # 5. ROI Calculation (Mock formula based on industry standard $500/adj/month friction reduction)
    roi = implemented_adjustments * 500 * 12 # Annualized
    
    # --- Activation Dashboard Metrics ---
    
    # 1. Setup de Marca
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    # Logic: True if branding_logo_url is present and not the default placeholder/empty
    brand_setup_completed = (org.branding_logo_url is not None and "teamworkz" not in org.branding_logo_url.lower()) if org else False
    
    # 2. Adopción del Perfil Sensorial (activacion_rate ya calculado arriba)
    sensory_profile_adoption = activation_rate
    
    # 3. Salud de la Accesibilidad
    # Logic: Score based on implemented adjustments vs requested (adequacy_index)
    accessibility_health = adequacy_index 
    
    # 4. Uso del Centro de Formación
    # Mocked for now as we don't have UserCourseProgress table
    learning_center_usage = 12 # Simulated value "píldoras consumidas"

    return {
        "inclusion_score": inclusion_score,
        "adequacy_index": f"{adequacy_index}%",
        "wellbeing_level": round(avg_wellbeing, 1),
        "activation_rate": f"{activation_rate}%",
        "roi_estimated": f"{roi:,}€",
        "neurodivergent_hires": 2, 
        "retention_rate": "94%",
        "hiring_velocity": "14 días",
        # New Activation Metrics
        "activation_metrics": {
            "brand_setup": brand_setup_completed,
            "sensory_adoption": sensory_profile_adoption,
            "accessibility_health": accessibility_health,
            "learning_usage": learning_center_usage
        }
    }
