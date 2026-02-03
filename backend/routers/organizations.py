from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import database
import models
import models_location

router = APIRouter(
    prefix="/organizations",
    tags=["organizations"],
)

@router.get("/")
def get_organizations(
    location_id: Optional[str] = Query(None, description="Filter by Location ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db)
):
    """
    Get list of organizations, optionally filtered by location.
    """
    query = db.query(models.Organization)
    
    if location_id:
        query = query.filter(models.Organization.location_id == location_id)
        
    orgs = query.offset(skip).limit(limit).all()
    
    return [
        {
            "id": str(org.id),
            "name": org.name,
            "industry": org.industry,
            "status": "validated", # Placeholder until we enforce validation logic
            "vacancies": 0, # Placeholder
            "lastActivity": org.created_at.isoformat(),
            "location_id": str(org.location_id) if org.location_id else None
        }
        for org in orgs
    ]

@router.get("/metrics/location/{location_id}")
def get_location_metrics(location_id: str, db: Session = Depends(database.get_db)):
    """
    Get impact metrics for a specific location (Municipality Dashboard).
    """
    # 1. Total Companies
    companies_count = db.query(models.Organization).filter(
        models.Organization.location_id == location_id
    ).count()
    
    # 2. Local Talent (Resident)
    local_talent = db.query(models.TalentProfile).filter(
        models.TalentProfile.residence_location_id == location_id
    ).count()
    
    # 3. New Residents (Attraction - Willing to move to this location)
    # This requires JSON query, which determines on DB dialect. 
    # For now, we will fetch all and filter in python for simplicity if dataset is small, 
    # or use simple count.
    # Postgres JSONb contains: 
    # filter(models.TalentProfile.target_locations.contains([location_id])) 
    
    # Simplified approach for prototype:
    attracted_talent = 0 
    # (To be implemented with proper JSON operators later)
    
    return {
        "companies_validated": companies_count,
        "local_candidates": local_talent,
        "new_residents_interest": attracted_talent,
        "insertion_rate": 85, # Mock for now
        "impact_score": 92    # Mock for now
    }
