
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import math
import uuid
import datetime

import models, schemas, auth, database
from utils.match_utils import calculate_affinity

router = APIRouter(
    prefix="/api/explorer",
    tags=["explorer"],
)

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians 
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # Radius of earth in kilometers. Use 3956 for miles
    return c * r

@router.post("/search", response_model=List[schemas.Challenge])
def search_challenges(
    query: schemas.ChallengeExplorerQuery,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Base query for open and public challenges
    challenges_query = db.query(models.Challenge).filter(
        models.Challenge.status == "open",
        models.Challenge.is_public == True
    )

    # Filter by Stimulus Level
    if query.stimulus_level:
        challenges_query = challenges_query.filter(models.Challenge.stimulus_level == query.stimulus_level)

    all_challenges = challenges_query.all()
    
    # Get User Data for Matching
    acc_profile = db.query(models.AccessibilityProfile).filter(models.AccessibilityProfile.user_id == current_user.id).first()
    sensory_needs = acc_profile.sensory_needs if acc_profile and acc_profile.sensory_needs else {}
    
    scored_results = []
    
    for challenge in all_challenges:
        score = 0
        dist_km = None
        
        # 1. Wellness & Infrastructure Filters (Optional)
        details = db.query(models.MunicipalityDetails).filter(models.MunicipalityDetails.location_id == challenge.tenant.location_id).first() if challenge.tenant else None
        
        if query.environment_type and details and details.environment_type != query.environment_type:
            continue
            
        if query.min_connectivity and details and not details.has_fiber_600:
            continue
            
        if query.has_services and details and not details.has_essential_services:
            continue
            
        # 2. Geospatial Distance
        loc = challenge.tenant.location if challenge.tenant else None
        if loc and loc.latitude and loc.longitude and query.user_latitude and query.user_longitude:
            dist_km = haversine(query.user_latitude, query.user_longitude, loc.latitude, loc.longitude)
            if query.max_distance_km and dist_km > query.max_distance_km:
                continue
        
        # 3. Sensory Affinity Matching (Official Rural Minds Formula)
        project_env = challenge.sensory_environment or {}
        final_score = calculate_affinity(sensory_needs, project_env)
        
        if query.min_match_score and final_score < query.min_match_score:
            continue
            
        # Enrich object with dynamic data
        challenge.match_score = final_score
        # For the UI: "A X km de ti"
        if dist_km is not None:
             setattr(challenge, "distance_label", f"A {round(dist_km, 1)} km de ti")
        
        scored_results.append(challenge)

    # Sort by Match Score Descending (A oasis of clarity)
    scored_results.sort(key=lambda x: getattr(x, 'match_score', 0), reverse=True)
    
    return scored_results

@router.get("/surprise-me", response_model=schemas.Challenge)
def surprise_me(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    'Pueblo del Mes' - Returns a high-affinity challenge to reduce decision fatigue.
    """
    # Simply get a high match challenge that the user hasn't applied to yet
    applied_ids = [app.challenge_id for app in current_user.applications]
    
    # Find best match
    best_match = None
    max_score = -1
    
    all_open = db.query(models.Challenge).filter(
        models.Challenge.status == "open",
        models.Challenge.is_public == True,
        ~models.Challenge.id.in_(applied_ids)
    ).all()
    
    if not all_open:
        raise HTTPException(status_code=404, detail="No nuevas recomendaciones hoy. Relájate y respira.")
        
    # Logic: Pick one of the top 5 randomly to spice it up
    # (Simplified for now: just the highest)
    # We could reuse search logic but for all.
    
    # Just return a random high quality one for now
    import random
    return random.choice(all_open)
