import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
from models_location import Location, Base
import uuid

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def seed_locations():
    db = SessionLocal()
    
    # Check if we have locations
    count = db.query(Location).count()
    if count > 0:
        print(f"Database already has {count} locations. Skipping seed.")
        return

    print("Seeding locations...")
    
    # Sample data: ~15 diverse Spanish municipalities
    sample_data = [
        {"municipality": "Soria", "province": "Soria", "autonomous_community": "Castilla y León"},
        {"municipality": "Almazán", "province": "Soria", "autonomous_community": "Castilla y León"},
        {"municipality": "Medinaceli", "province": "Soria", "autonomous_community": "Castilla y León"},
        {"municipality": "El Burgo de Osma", "province": "Soria", "autonomous_community": "Castilla y León"},
        {"municipality": "Teruel", "province": "Teruel", "autonomous_community": "Aragón"},
        {"municipality": "Albarracín", "province": "Teruel", "autonomous_community": "Aragón"},
        {"municipality": "Mora de Rubielos", "province": "Teruel", "autonomous_community": "Aragón"},
        {"municipality": "Zamora", "province": "Zamora", "autonomous_community": "Castilla y León"},
        {"municipality": "Puebla de Sanabria", "province": "Zamora", "autonomous_community": "Castilla y León"},
        {"municipality": "Cangas del Narcea", "province": "Asturias", "autonomous_community": "Asturias"},
        {"municipality": "Llanes", "province": "Asturias", "autonomous_community": "Asturias"},
        {"municipality": "Cazorla", "province": "Jaén", "autonomous_community": "Andalucía"},
        {"municipality": "Úbeda", "province": "Jaén", "autonomous_community": "Andalucía"},
        {"municipality": "Plasencia", "province": "Cáceres", "autonomous_community": "Extremadura"},
        {"municipality": "Trujillo", "province": "Cáceres", "autonomous_community": "Extremadura"},
    ]
    
    for item in sample_data:
        loc = Location(
            municipality=item["municipality"],
            province=item["province"],
            autonomous_community=item["autonomous_community"]
        )
        db.add(loc)
    
    try:
        db.commit()
        print(f"Successfully added {len(sample_data)} locations.")
    except Exception as e:
        print(f"Error seeding locations: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_locations()
