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
    current_user: models.User = Depends(auth.get_current_user)
):
    org_id = current_user.organization_id
    if not org_id:
        # Return empty/default if no organization context
        return {
            "inclusion_score": 0,
            "retention_rate": "N/A",
            "hiring_velocity": "N/A",
            "roi_estimated": "$0"
        }

    # 1. Activation Rate: Users with Accessibility Profile / Total Users
    total_users = db.query(models.User).filter(models.User.organization_id == org_id).count()
    active_profiles = db.query(models.AccessibilityProfile).join(models.User).filter(models.User.organization_id == org_id).count()
    activation_rate = int((active_profiles / total_users * 100) if total_users > 0 else 0)

    # 2. Adequacy Index: Implemented Adjustments / Requested Adjustments
    total_adjustments = db.query(models.AdjustmentsLog).filter(models.AdjustmentsLog.organization_id == org_id).count()
    implemented_adjustments = db.query(models.AdjustmentsLog).filter(
        models.AdjustmentsLog.organization_id == org_id, 
        models.AdjustmentsLog.status == 'implemented'
    ).count()
    adequacy_index = int((implemented_adjustments / total_adjustments * 100) if total_adjustments > 0 else 0)

    # 3. Well-being Level: Average feedback score
    feedbacks = db.query(models.AdjustmentsLog.feedback_score).filter(
        models.AdjustmentsLog.organization_id == org_id, 
        models.AdjustmentsLog.feedback_score.isnot(None)
    ).all()
    avg_wellbeing = sum([f[0] for f in feedbacks]) / len(feedbacks) if feedbacks else 0
    
    # 4. Inclusion Score (Composite KPI)
    # Weighted average: 40% Activation + 60% Adequacy
    inclusion_score = int(activation_rate * 0.4 + adequacy_index * 0.6)

    # 5. ROI Calculation (Mock formula based on industry standard $500/adj/month friction reduction)
    roi = implemented_adjustments * 500 * 12 # Annualized
    
    return {
        "inclusion_score": inclusion_score,
        "adequacy_index": f"{adequacy_index}%",
        "wellbeing_level": round(avg_wellbeing, 1),
        "activation_rate": f"{activation_rate}%",
        "roi_estimated": f"${roi:,}",
        "neurodivergent_hires": 2, # Still mocked as Application flow isn't fully linked
        "retention_rate": "94%",
        "hiring_velocity": "14 days"
    }
