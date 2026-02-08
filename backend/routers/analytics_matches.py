from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
import uuid
import datetime

import models
import database
import auth
from models_location import Location

router = APIRouter(
    prefix="/admin/analytics",
    tags=["admin-analytics"],
)

def require_super_admin(current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return current_user

@router.get("/match-funnel")
def get_match_funnel(
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """
    Succes Funnel (Conversion Funnel)
    1. Interés Manifestado (Applications + Support Messages)
    2. Contactos Iniciados (Total Support Messages Sent)
    3. Conversaciones Activas (Responded support msgs + Apps with messages)
    4. Matches Consolidados (Consent shared + Accepted apps)
    """
    # 1. Interest
    apps_count = db.query(models.Application).count()
    support_sent_count = db.query(models.MunicipalSupportMessage).count()
    interest_manifested = apps_count + support_sent_count

    # 2. Contacts Initiated
    # Already support_sent_count covers this from municipality side
    contacts_initiated = support_sent_count

    # 3. Active Conversations
    responded_support = db.query(models.MunicipalSupportMessage).filter(
        models.MunicipalSupportMessage.response_type.in_(["A", "B"])
    ).count()
    
    # Apps with messages (at least one message from talent or company)
    # This requires a subquery or join
    apps_with_msgs = db.query(models.Message.application_id).distinct().count()
    active_conversations = responded_support + apps_with_msgs

    # 4. Success / Consolidated
    consolidated_support = db.query(models.MunicipalSupportMessage).filter(
        models.MunicipalSupportMessage.privacy_consent_shared == True
    ).count()
    accepted_apps = db.query(models.Application).filter(
        models.Application.status == "accepted"
    ).count()
    matches_consolidated = consolidated_support + accepted_apps

    return {
        "funnel": [
            {"label": "Interés Manifestado", "value": interest_manifested, "icon": "👁️"},
            {"label": "Contactos Iniciados", "value": contacts_initiated, "icon": "📩"},
            {"label": "Conversaciones Activas", "value": active_conversations, "icon": "💬"},
            {"label": "Matches Consolidados", "value": matches_consolidated, "icon": "✅"}
        ]
    }

@router.get("/match-map-links")
def get_match_map_links(
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """
    Returns Origin -> Target pairs for the map visualization.
    Green: Attraction (Different province)
    Blue: Arraigo (Same province)
    """
    links = []
    
    # Process Municipal Support Messages
    support_msgs = db.query(models.MunicipalSupportMessage).all()
    for msg in support_msgs:
        muni = db.query(models.Organization).get(msg.municipality_id)
        talent_profile = db.query(models.TalentProfile).get(msg.talent_profile_id)
        
        if muni and talent_profile:
            # Get locations
            muni_loc = db.query(Location).filter(Location.id == muni.location_id).first()
            talent_loc = db.query(Location).filter(Location.id == talent_profile.residence_location_id).first()
            
            if muni_loc and talent_loc:
                is_local = muni_loc.municipality == talent_loc.municipality
                is_attraction = muni_loc.province != talent_loc.province
                links.append({
                    "id": str(msg.id),
                    "type": "local" if is_local else ("attraction" if is_attraction else "rooting"),
                    "origin": {"name": talent_loc.municipality, "province": talent_loc.province},
                    "target": {"name": muni_loc.municipality, "province": muni_loc.province},
                    "status": msg.status,
                    "is_local": is_local
                })

    # Process Successful Applications
    apps = db.query(models.Application).filter(models.Application.status == "accepted").all()
    for app in apps:
        challenge = db.query(models.Challenge).get(app.challenge_id)
        talent_profile = db.query(models.TalentProfile).filter(models.TalentProfile.user_id == app.user_id).first()
        
        if challenge and talent_profile:
            org = db.query(models.Organization).get(challenge.tenant_id)
            if org:
                muni_loc = db.query(Location).filter(Location.id == org.location_id).first()
                talent_loc = db.query(Location).filter(Location.id == talent_profile.residence_location_id).first()
                
                if muni_loc and talent_loc:
                    is_local = muni_loc.municipality == talent_loc.municipality
                    is_attraction = muni_loc.province != talent_loc.province
                    links.append({
                        "id": str(app.id),
                        "type": "local" if is_local else ("attraction" if is_attraction else "rooting"),
                        "origin": {"name": talent_loc.municipality, "province": talent_loc.province},
                        "target": {"name": muni_loc.municipality, "province": muni_loc.province},
                        "status": "match",
                        "is_local": is_local
                    })
                    
    return links

@router.get("/match-details")
def get_match_details(
    limit: int = 50,
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """
    Real-time relationships table with 'Cold Match' alert.
    """
    results = []
    seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    
    # Support messages
    support_msgs = db.query(models.MunicipalSupportMessage).order_by(models.MunicipalSupportMessage.created_at.desc()).limit(limit).all()
    for msg in support_msgs:
        muni = db.query(models.Organization).get(msg.municipality_id)
        talent_profile = db.query(models.TalentProfile).get(msg.talent_profile_id)
        
        if muni and talent_profile:
            talent_user = db.query(models.User).get(talent_profile.user_id)
            
            # Cold check: sent/received but no movement in 7 days
            last_activity = msg.responded_at or msg.created_at
            is_cold = (msg.status == "sent") and (last_activity < seven_days_ago)
            
            status_map = {
                "sent": "📩 Mensaje Enviado",
                "accepted": "💬 En conversación",
                "declined": "❌ Rechazado"
            }
            if msg.privacy_consent_shared:
                status_map["accepted"] = "✅ Datos Compartidos"

            # Location check for local tag
            is_local = False
            muni_loc = db.query(Location).filter(Location.id == muni.location_id).first()
            talent_loc = db.query(Location).filter(Location.id == talent_profile.residence_location_id).first()
            if muni_loc and talent_loc:
                is_local = muni_loc.municipality == talent_loc.municipality

            results.append({
                "municipality": muni.name,
                "talent_id": f"RM-{str(talent_profile.id)[:4].upper()}",
                "type": "Local (Arraigo)" if is_local else ("Atracción" if talent_profile.is_willing_to_move else "Arraigo Provincial"),
                "status": status_map.get(msg.status, msg.status),
                "last_move": last_activity.isoformat(),
                "is_cold": is_cold,
                "is_local": is_local
            })
            
    return results

@router.get("/municipality-ranking")
def get_municipality_ranking(
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_super_admin)
):
    """
    Ranking of active municipalities based on activity.
    Score = (Messages Sent * 2) + (Matches * 5)
    """
    municipalities = db.query(models.Organization).filter(models.Organization.org_type == "municipality").all()
    ranking = []

    for muni in municipalities:
        # Messages Sent
        msgs_sent = db.query(models.MunicipalSupportMessage).filter(
            models.MunicipalSupportMessage.municipality_id == muni.id
        ).count()

        # Matches (Accepted applications for challenges created by this municipality)
        # OR Consent shared in support messages
        support_matches = db.query(models.MunicipalSupportMessage).filter(
            models.MunicipalSupportMessage.municipality_id == muni.id,
            models.MunicipalSupportMessage.privacy_consent_shared == True
        ).count()

        # Challenge matches
        challenge_matches = db.query(models.Application).join(models.Challenge).filter(
            models.Challenge.tenant_id == muni.id,
            models.Application.status == "accepted"
        ).count()

        total_matches = support_matches + challenge_matches
        score = (msgs_sent * 2) + (total_matches * 5)

        ranking.append({
            "id": str(muni.id),
            "name": muni.name,
            "logo": muni.branding_logo_url,
            "msgs_sent": msgs_sent,
            "matches": total_matches,
            "score": score,
            "is_star": score > 50 # Example threshold for visual badge
        })

    # Sort by score descending
    ranking.sort(key=lambda x: x["score"], reverse=True)
    return ranking
