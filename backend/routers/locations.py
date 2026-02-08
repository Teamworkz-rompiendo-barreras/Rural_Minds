from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import database
import models_location, models, auth

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
def get_location_details(
    location_id: str, 
    db: Session = Depends(database.get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional)
):
    """
    Get detailed profile for a municipality, including sensory pulse and active projects.
    """
    # 1. Fetch Location
    location = db.query(models_location.Location).filter(models_location.Location.id == location_id).first()
    if not location:
        return {"error": "Location not found"}

    # 2. Fetch Details
    details = db.query(models_location.MunicipalityDetails).filter(models_location.MunicipalityDetails.location_id == location_id).first()
    
    # 3. Fetch Resources (Guides)
    resource = db.query(models_location.MunicipalityResource).filter(models_location.MunicipalityResource.location_id == location_id).first()

    # 4. Fetch Active Challenges in this municipality
    # Challenges are linked to organizations, which are linked to municipalities.
    active_challenges = db.query(models.Challenge).join(models.Organization).filter(
        models.Organization.municipality_id == location_id,
        models.Challenge.status == "open",
        models.Challenge.is_public == True
    ).all()

    # 5. Calculate Affinity Match % if user is talent
    match_score = None
    if current_user and current_user.role == "talent" and details:
        # Simple match logic based on environment_type preference if it exists
        score = 80 # Baseline for a town that supports neurodiversity
        
        profile = current_user.talent_profile
        if profile and profile.preferences:
            pref_env = profile.preferences.get("environment_type")
            if pref_env == details.environment_type:
                score += 15
        
        match_score = min(100, score)

    return {
        "id": str(location.id),
        "municipality": location.municipality,
        "province": location.province,
        "autonomous_community": location.autonomous_community,
        "latitude": location.latitude,
        "longitude": location.longitude,
        
        "match_score": match_score,
        
        # Vital Stats
        "population": details.population if details else 0,
        "altitude": details.altitude if details else 0,
        "average_climate": details.average_climate if details else "Templado",
        
        # Branding
        "slogan": details.slogan if details else f"Vivir en {location.municipality}: Tu talento, nuestras raíces",
        "description": details.description if details else f"Descubre la calidad de vida en {location.municipality}.",
        
        # Infrastructure
        "internet_speed": details.internet_speed if details else "Conectividad 4G/5G",
        "has_fiber_600": details.has_fiber_600 if details else False,
        "connectivity_info": details.connectivity_info if details else "Conectado por carretera",
        "mobile_coverage": details.mobile_coverage if details else "Buena",
        "has_coworking": details.has_coworking if details else False,
        
        # Sensory Pulse
        "environment_type": details.environment_type if details else "Interior",
        "noise_level": details.noise_level if details else "Tranquilo",
        "light_pollution": details.light_pollution if details else "Baja",
        "life_pace": details.life_pace if details else "Pueblo pausado",
        
        "climate_co2": details.climate_co2 if details else "Entorno natural saludable",
        "services": details.services if details else {
            "health": "Centro de Salud a <5km",
            "education": "Escuela Rural",
            "coworking": "Espacios municipales",
            "commerce": "Comercio local"
        },
        "has_essential_services": details.has_essential_services if details else False,
        "gallery_urls": details.gallery_urls if details else [],
        
        # Projects
        "active_projects": [
            {"id": str(c.id), "title": c.title, "company": c.tenant.name}
            for c in active_challenges
        ],
        
        # Resources
        "landing_guide_url": resource.landing_guide_url if resource else None,
        "adl_contact_email": resource.adl_contact_email if resource else None
    }
