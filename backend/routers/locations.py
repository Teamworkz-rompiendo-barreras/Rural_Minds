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

@router.get("/regions")
def get_regions(db: Session = Depends(database.get_db)):
    """Get all unique autonomous communities."""
    regions = db.query(models_location.Location.autonomous_community).distinct().all()
    return [r[0] for r in regions if r[0]]

@router.get("/provinces")
def get_provinces(region: str, db: Session = Depends(database.get_db)):
    """Get all unique provinces for a given region."""
    provinces = db.query(models_location.Location.province).filter(
        models_location.Location.autonomous_community == region
    ).distinct().all()
    return [p[0] for p in provinces if p[0]]

@router.get("/municipalities")
def search_municipalities(
    region: str,
    province: str,
    q: Optional[str] = Query(None, min_length=1),
    db: Session = Depends(database.get_db)
):
    """
    Search for municipalities within a specific Region and Province.
    """
    query = db.query(models_location.Location).filter(
        models_location.Location.autonomous_community == region,
        models_location.Location.province == province
    )
    
    if q:
        term = f"%{q}%"
        query = query.filter(models_location.Location.municipality.ilike(term))
        
    locations = query.limit(20).all()
    
    return [
        {
            "id": str(loc.id),
            "municipality": loc.municipality,
            "province": loc.province,
            "autonomous_community": loc.autonomous_community
        }
        for loc in locations
    ]

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

@router.get("/{location_id}/details")
def get_location_details(location_id: str, db: Session = Depends(database.get_db)):
    """
    Get detailed profile for a municipality.
    """
    # 1. Fetch Location
    location = db.query(models_location.Location).filter(models_location.Location.id == location_id).first()
    if not location:
        return {"error": "Location not found"}

    # 2. Fetch Details
    details = db.query(models_location.MunicipalityDetails).filter(models_location.MunicipalityDetails.location_id == location_id).first()
    
    # 3. Fetch Resources (Guides)
    resource = db.query(models_location.MunicipalityResource).filter(models_location.MunicipalityResource.location_id == location_id).first()

    return {
        "id": str(location.id),
        "municipality": location.municipality,
        "province": location.province,
        "autonomous_community": location.autonomous_community,
        
        # Details (or defaults)
        "slogan": details.slogan if details else f"Vivir en {location.municipality}: Tu talento, nuestras raíces",
        "description": details.description if details else f"Descubre la calidad de vida en {location.municipality}.",
        "internet_speed": details.internet_speed if details else "Conectividad 4G/5G", # Default fallback
        "connectivity_info": details.connectivity_info if details else "Conectado por carretera y transporte público",
        "climate_co2": details.climate_co2 if details else "Entorno natural saludable",
        "services": details.services if details else {
            "health": "Centro de Salud a <5km",
            "education": "Escuela Rural e Instituto comarcal",
            "coworking": "Espacios disponibles en ayuntamiento",
            "commerce": "Comercio local y mercado semanal"
        },
        "gallery_urls": details.gallery_urls if details else [],
        
        # Resources
        "landing_guide_url": resource.landing_guide_url if resource else None,
        "adl_contact_email": resource.adl_contact_email if resource else None
    }
