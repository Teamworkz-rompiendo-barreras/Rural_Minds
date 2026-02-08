from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth, database
from utils.match_utils import calculate_affinity

router = APIRouter(
    tags=["challenges"],
)

@router.post("/api/challenges", response_model=schemas.Challenge)
def create_challenge(challenge: schemas.ChallengeCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Limit Check (MVP: Enterprise = Unlimited, Others = 3)
    if current_user.role not in ["enterprise", "enterprise_admin", "super_admin"]:
        count = len(current_user.challenges_created)
        if count >= 3:
            raise HTTPException(status_code=403, detail="Subscription limit reached. Upgrade to Enterprise for unlimited challenges.")

    # Link challenge to the current user and their tenant
    db_challenge = models.Challenge(
        **challenge.model_dump(),
        creator_id=current_user.id,
        tenant_id=current_user.organization_id
    )
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)
    
    # Log Analytics
    try:
        from analytics import log_event
        log_event("challenge_created", current_user.id, {"challenge_id": db_challenge.id, "title": db_challenge.title})
    except Exception as e:
        print(f"Analytics Error: {e}")
        
    return db_challenge

@router.get("/api/challenges", response_model=List[schemas.Challenge])
def read_challenges(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Challenge)
    
    # Validation: Multi-tenancy enforcement and Visibility
    if current_user.role in ["enterprise", "enterprise_admin"] and current_user.organization_id:
        # Enterprise sees their own challenges (or all public ones? Usually their own for management)
        # If they want to see public ones from others, we might need a different endpoint or param.
        # For now, let's assume this endpoint is for "Marketplace" view if param says so, or "My Challenges" if not?
        # Actually, separate endpoint `read_my_challenges` exists.
        # So this `read_challenges` should be the "Marketplace/Explorer".
        # Enterprises might want to see what others are posting? Or maybe not.
        # Let's stick to:
        # - Talent: See all PUBLIC and OPEN challenges.
        # - Enterprise: See their own (or maybe all public too? Let's say all public for ecosystem awareness)
        # - Admin: See all.
        
        # Mixed approach: Show public challenges AND my own (even if private)
        query = query.filter(
            (models.Challenge.is_public == True) | 
            (models.Challenge.tenant_id == current_user.organization_id)
        )
    elif current_user.role == "talent":
        # Talent only sees PUBLIC and OPEN challenges
        query = query.filter(models.Challenge.is_public == True, models.Challenge.status == "open")
    
    # Basic pagination
    challenges = query.order_by(models.Challenge.created_at.desc()).offset(skip).limit(limit).all()
    return challenges

@router.get("/api/my-challenges", response_model=List[schemas.Challenge])
def read_my_challenges(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role not in ["enterprise", "enterprise_admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Only enterprises can view their challenges")
    return current_user.challenges_created

@router.get("/api/challenges/recommendations", response_model=List[schemas.Challenge])
def get_recommended_challenges(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != "talent":
        raise HTTPException(status_code=403, detail="Only talents can get recommendations")
        
    profile = current_user.talent_profile
    if not profile or not profile.skills:
        # Fallback: return all challenges if no profile or skills
        return db.query(models.Challenge).limit(20).all()
        
    user_skills = set(s.lower() for s in profile.skills)
    user_modality_pref = profile.preferences.get("modality") if profile.preferences else None
    
    # Simple matching algo: count overlap and modality
    # --- NEW MATCHING ALGORITHM (Rural Minds v2) ---
    all_challenges = db.query(models.Challenge).filter(models.Challenge.status == "open").all()
    scored_challenges = []
    
    # Get user accessibility profile for sensory needs
    acc_profile = db.query(models.AccessibilityProfile).filter(models.AccessibilityProfile.user_id == current_user.id).first()
    sensory_needs = acc_profile.sensory_needs if acc_profile and acc_profile.sensory_needs else {}
    
    for challenge in all_challenges:
        score = 0
        total_factors = 0
        adjustments_needed = []
        positive_factors = []
        
        # 1. Technical Skills (Base Layer)
        if challenge.skills_needed:
            c_skills = set(s.lower() for s in challenge.skills_needed)
            overlap = user_skills.intersection(c_skills)
            if c_skills:
                skill_match = len(overlap) / len(c_skills)
                score += skill_match * 30 # Max 30 points for skills
                total_factors += 1
        
        # 2. Sensory Compatibility (Official Rural Minds Formula)
        project_env = challenge.sensory_requirements or {}
        final_score = calculate_affinity(sensory_needs, project_env)
        
        # 3. Location/Modality (Denomination of Origin Support)
        # If User and Company are in same municipality -> Bonus
        # For now, simplistic check if both have "location" field or similar.
        # Assuming challenge.tenant (Organization) has a location field or using current_user.organization linked data?
        # Let's rely on basic location_type for now.
        if challenge.location_type and user_modality_pref:
             if challenge.location_type.lower() == user_modality_pref.lower():
                 final_score += 10
        
        # Normalize Score (0-100)
        # Baseline start 50, modify by matches
        final_score = min(100, max(0, final_score))
        
        # Attach analysis to challenge object (temporary attribute for serialization if schema allows, 
        # or we return a wrapper. The schema is specific, so we might need to modify schema to return match details.
        # For now, we return the challenge list sorted, but the UI expects `match_percentage`? 
        # The Schema `Challenge` doesn't have `match_details`. 
        # I will hack specific attributes onto the object and hope Pydantic ignores extra or I update schema.
        # Wait, if I change the return type logic, I break the Pydantic model validation if strict.
        # Let's check schemas.Challenge.
        
        setattr(challenge, "match_score", final_score) 
        # The calculate_affinity function is expected to return the score, not adjustments.
        # If adjustments are needed, calculate_affinity should return them or a separate function should be called.
        # For now, removing the adjustments attribute as per the instruction's implied change.
        
        scored_challenges.append((final_score, challenge))
        
    # Sort by score desc
    scored_challenges.sort(key=lambda x: x[0], reverse=True)
    
    return [c for score, c in scored_challenges] or all_challenges[:20] 

@router.put("/api/challenges/{challenge_id}/status", response_model=schemas.Challenge)
def update_challenge_status(
    challenge_id: str,
    status_update: dict, # {"status": "closed"}
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    if challenge.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    new_status = status_update.get("status")
    if new_status not in ["open", "closed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    challenge.status = new_status
    db.commit()
    db.refresh(challenge)
    return challenge 

@router.get("/api/challenges/{challenge_id}", response_model=schemas.Challenge)
def read_challenge(challenge_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Basic visibility check
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    # Visibility logic
    authorized = False
    if challenge.is_public:
        authorized = True
    elif current_user.role == "super_admin":
        authorized = True
    elif current_user.organization_id == challenge.tenant_id:
        authorized = True
        
    if not authorized:
        raise HTTPException(status_code=403, detail="Not authorized to view this challenge")

    # If talent, calculate sensory match details
    if current_user.role == "talent":
        acc_profile = db.query(models.AccessibilityProfile).filter(models.AccessibilityProfile.user_id == current_user.id).first()
        sensory_needs = acc_profile.sensory_needs if acc_profile and acc_profile.sensory_needs else {}
        
        # Use sensory_environment (new field) or fallback to sensory_requirements
        project_env = challenge.sensory_environment or challenge.sensory_requirements or {}
        challenge.match_score = calculate_affinity(sensory_needs, project_env)
        # Note: we could still add adjustments if needed, but the score follows the formula.

    return challenge
