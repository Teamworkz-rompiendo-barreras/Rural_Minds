from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth, database

router = APIRouter(
    tags=["challenges"],
)

@router.post("/api/challenges", response_model=schemas.Challenge)
def create_challenge(challenge: schemas.ChallengeCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Limit Check (MVP: Enterprise = Unlimited, Others = 3)
    if current_user.role not in ["enterprise", "super_admin"]:
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
    
    # Validation: Multi-tenancy enforcement
    if current_user.role == "enterprise" and current_user.organization_id:
        query = query.filter(models.Challenge.tenant_id == current_user.organization_id)
    
    # Talents can see open challenges? Assuming yes for marketplace.
    # Admins see all.
    
    challenges = query.offset(skip).limit(limit).all()
    return challenges

@router.get("/api/my-challenges", response_model=List[schemas.Challenge])
def read_my_challenges(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != "enterprise" and current_user.role != "super_admin":
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
    all_challenges = db.query(models.Challenge).all()
    scored_challenges = []
    
    for challenge in all_challenges:
        score = 0
        
        # Skill Match (Weight: 2 points per skill)
        if challenge.skills_needed:
            challenge_skills = set(s.lower() for s in challenge.skills_needed)
            overlap = user_skills.intersection(challenge_skills)
            score += len(overlap) * 2
            
        # Modality Match (Weight: 5 points)
        if user_modality_pref and challenge.location_type:
            # simple string match "remote" == "remote"
            if user_modality_pref.lower() == challenge.location_type.lower():
                score += 5

        # Neurodivergent Trait Match (Bonus Points)
        if profile.neurodivergent_traits:
            traits = set(profile.neurodivergent_traits)
            
            # 1. Written Communication Preferred -> Bonus if challenge uses Slack/Email/Written
            if "Written Communication Preferred" in traits:
                comm_pref = ""  # No communication_pref field yet
                if any(x in comm_pref for x in ["slack", "email", "written", "async"]):
                    score += 5
            
            # 2. Sensory Friendly -> Bonus if Remote (controlled environment)
            if "Sensory Friendly Environment" in traits:
                if challenge.location_type and challenge.location_type.lower() == "remote":
                    score += 3
            
            # 3. Structured Tasks -> Bonus if Autonomy Level is Low (1-3)
            # 3. Structured Tasks -> Bonus if Autonomy Level is Low (1-3)
            # if "Structured Tasks" in traits:
            #     pass # No autonomy_level field yet
        
        scored_challenges.append((score, challenge))
        
    # Sort by score desc
    scored_challenges.sort(key=lambda x: x[0], reverse=True)
    
    # Return just the challenge objects, filter out zero scores
    return [c for score, c in scored_challenges if score > 0] or all_challenges[:20] 

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
