from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import database
import models_location

router = APIRouter(
    prefix="/locations",
    tags=["locations"],
)

@router.get("/search")
def search_locations(
    q: str = Query(..., min_length=2, description="Search term for municipality or province"),
    db: Session = Depends(database.get_db)
):
    """
    Search for locations by municipality or province.
    Returns up to 10 matching results.
    """
    term = f"%{q}%"
    locations = db.query(models_location.Location).filter(
        or_(
            models_location.Location.municipality.ilike(term),
            models_location.Location.province.ilike(term)
        )
    ).limit(10).all()
    
    return [
        {
            "id": str(loc.id),
            "label": f"{loc.municipality} ({loc.province})",
            "municipality": loc.municipality,
            "province": loc.province,
            "autonomous_community": loc.autonomous_community
        }
        for loc in locations
    ]
