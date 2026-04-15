from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List, Optional
import datetime

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
        "roi_estimated": f"{roi:,}€".replace(",", "."),
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

@router.get("/impact-map")
def get_impact_map_data(
    ccaa: Optional[str] = None,
    skill: Optional[str] = None,
    only_success: bool = Query(False),
    db: Session = Depends(database.get_db),
    _: models.User = Depends(auth.get_current_user)
):
    """
    Data source for the 'Mapa de Flujos de Vida'.
    Aggregates talent flows from origin locations to destinations.
    """
    from models_location import Location
    
    # 1. Fetch all relevant TalentProfiles with Origin Locations
    talent_query = db.query(models.TalentProfile).join(models.User)
    if skill:
        talent_query = talent_query.filter(models.TalentProfile.skills.contains([skill]))
    
    profiles = talent_query.all()
    
    points = {} # ID -> {name, lat, lng, origin_weight, target_weight}
    flows = {} # (origin, target, status) -> count
    
    def add_point(loc: Location, is_origin=False, is_target=False):
        if not loc or not loc.latitude or not loc.longitude:
            return
        loc_id = str(loc.id)
        if loc_id not in points:
            points[loc_id] = {
                "id": loc_id,
                "name": loc.municipality,
                "province": loc.province,
                "ccaa": loc.autonomous_community,
                "lat": loc.latitude,
                "lng": loc.longitude,
                "origin_weight": 0,
                "target_weight": 0
            }
        if is_origin: points[loc_id]["origin_weight"] += 1
        if is_target: points[loc_id]["target_weight"] += 1

    # 2. Extract Flows - Interest (Willing to Move)
    if not only_success:
        for p in profiles:
            if not p.residence_location_id or not p.is_willing_to_move:
                continue
            
            origin_loc = db.query(Location).filter(Location.id == p.residence_location_id).first()
            if not origin_loc: continue
            
            for target_id in (p.target_locations or []):
                target_loc = db.query(Location).filter(Location.id == target_id).first()
                if not target_loc: continue
                
                # Apply CCAA Filter to destination
                if ccaa and target_loc.autonomous_community != ccaa:
                    continue
                
                add_point(origin_loc, is_origin=True)
                add_point(target_loc, is_target=True)
                
                flow_key = (str(origin_loc.id), str(target_loc.id), "interest")
                flows[flow_key] = flows.get(flow_key, 0) + 1

    # 3. Extract Flows - Success (Accepted/Hired Applications)
    # Success flows are solid lines
    app_query = db.query(models.Application).filter(models.Application.status.in_(["accepted", "hired"]))
    
    # Filter by talent profile subset (if skill filter applied)
    if skill:
        user_ids = [p.user_id for p in profiles]
        app_query = app_query.filter(models.Application.user_id.in_(user_ids))
        
    apps = app_query.all()
    
    for app in apps:
        talent_p = db.query(models.TalentProfile).filter(models.TalentProfile.user_id == app.user_id).first()
        if not talent_p or not talent_p.residence_location_id:
            continue
            
        challenge = db.query(models.Challenge).filter(models.Challenge.id == app.challenge_id).first()
        if not challenge or not challenge.tenant_id:
            continue
            
        org = db.query(models.Organization).filter(models.Organization.id == challenge.tenant_id).first()
        if not org or not org.location_id:
            continue
            
        origin_loc = db.query(Location).filter(Location.id == talent_p.residence_location_id).first()
        target_loc = db.query(Location).filter(Location.id == org.location_id).first()
        
        if not origin_loc or not target_loc:
            continue
            
        # Apply CCAA Filter to destination
        if ccaa and target_loc.autonomous_community != ccaa:
            continue
            
        add_point(origin_loc, is_origin=True)
        add_point(target_loc, is_target=True)
        
        flow_key = (str(origin_loc.id), str(target_loc.id), "success")
        flows[flow_key] = flows.get(flow_key, 0) + 1

    # Format result
    formatted_flows = [
        {"origin_id": k[0], "target_id": k[1], "status": k[2], "count": v}
        for k, v in flows.items()
    ]
    
    return {
        "points": list(points.values()),
        "flows": formatted_flows
    }

@router.post("/interaction")
def log_town_interaction(
    payload: dict,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Logs a talent interaction with a town (favorite or commitment)."""
    if current_user.role != "talent":
        return {"status": "skipped", "reason": "not_talent"}
    
    # Extract origin province for denormalization
    origin_province = None
    if current_user.talent_profile and current_user.talent_profile.residence_location_id:
        loc = db.query(models.Location).filter(models.Location.id == current_user.talent_profile.residence_location_id).first()
        if loc:
            origin_province = loc.province

    interaction = models.TownInteraction(
        talent_id=current_user.id,
        location_id=payload.get("location_id"),
        interaction_type=payload.get("type", "favorite"),
        origin_province=origin_province
    )
    db.add(interaction)
    db.commit()
    return {"status": "logged"}

@router.get("/smart-insights")
def get_smart_insights(
    db: Session = Depends(database.get_db),
    _: models.User = Depends(auth.get_current_user)
):
    """
    Detects trends in municipality interest using the TR growth formula.
    TR = ((V_today - V_avg30) / V_avg30) * 100
    """
    now = datetime.datetime.utcnow()
    last_24h = now - datetime.timedelta(hours=24)
    last_30d = now - datetime.timedelta(days=30)
    
    # 1. Total interactions in last 30 days grouped by location
    interactions_30d = db.query(
        models.TownInteraction.location_id,
        func.count(models.TownInteraction.id)
    ).filter(models.TownInteraction.timestamp >= last_30d)\
     .group_by(models.TownInteraction.location_id).all()
    
    # 2. Total interactions in last 24h grouped by location
    interactions_24h = db.query(
        models.TownInteraction.location_id,
        func.count(models.TownInteraction.id)
    ).filter(models.TownInteraction.timestamp >= last_24h)\
     .group_by(models.TownInteraction.location_id).all()
    
    stats_30d = {str(loc_id): count for loc_id, count in interactions_30d}
    stats_24h = {str(loc_id): count for loc_id, count in interactions_24h}
    
    alerts = []
    
    # 3. Calculate TR for each location that had activity recently
    for loc_id_str, v_actual in stats_24h.items():
        v_media_30 = stats_30d.get(loc_id_str, 0) / 30.0
        
        if v_media_30 == 0:
            tr = 100.0 if v_actual > 0 else 0 # First interaction is a 100% relative spike
        else:
            tr = ((v_actual - v_media_30) / v_media_30) * 100
            
        if tr > 10: # Only report if growth is visible
            loc = db.query(models.Location).filter(models.Location.id == loc_id_str).first()
            if not loc: continue
            
            # Find origin pattern
            origin_counts = db.query(
                models.TownInteraction.origin_province,
                func.count(models.TownInteraction.id)
            ).filter(
                models.TownInteraction.location_id == loc_id_str,
                models.TownInteraction.timestamp >= last_24h
            ).group_by(models.TownInteraction.origin_province)\
             .order_by(func.count(models.TownInteraction.id).desc()).first()
            
            origin_name = origin_counts[0] if origin_counts else "Desconocido"
            
            # Severity mapping
            # Blue: >10%, Orange: >25%, Red: >50% (or high volume)
            severity = "blue"
            if tr > 25: severity = "orange"
            if tr > 50 or v_actual > 20: severity = "red"
            
            alerts.append({
                "id": loc_id_str,
                "town_name": loc.municipality,
                "province": loc.province,
                "tr_score": round(tr, 1),
                "phenomenon": f"Interés incrementado un {round(tr, 1)}%",
                "origin": origin_name,
                "actual_volume": v_actual,
                "severity": severity,
                "reason": f"Pico de búsquedas desde {origin_name} detectado."
            })
            
    # Sort by TR score descending
    alerts.sort(key=lambda x: x["tr_score"], reverse=True)
    return alerts[:10] # Return top 10 trends
