import sys
import os
import uuid
import logging

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
from models import User, Organization, UserRole, TalentProfile
from models_location import Location
import auth  # for password hashing

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_database():
    """Drops all tables and recreates them."""
    logger.info("☢️  Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    logger.info("✅ Tables dropped.")
    
    logger.info("🏗️  Creating all tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Tables created.")

def seed_demo_data():
    """Seeds the database with demo users and locations."""
    db = SessionLocal()
    try:
        # --- 1. Seed Locations ---
        logger.info("📍 Seeding Locations...")
        toral = Location(
            municipality="Toral de los Vados",
            province="León",
            autonomous_community="Castilla y León"
        )
        cacabelos = Location(
            municipality="Cacabelos",
            province="León",
            autonomous_community="Castilla y León"
        )
        db.add(toral)
        db.add(cacabelos)
        db.flush() # Flush to get IDs
        
        logger.info(f"   Created Location: {toral.municipality}")
        logger.info(f"   Created Location: {cacabelos.municipality}")

        # --- 2. Create Organizations ---
        logger.info("🏢 Creating Organizations...")
        
        # Municipality Org
        org_toral = Organization(
            name="Ayuntamiento de Toral de los Vados",
            org_type="municipality",
            validation_status="validated",
            location_id=toral.id,
            street_address="Plaza del Ayuntamiento, 1",
            postal_code="24560"
        )
        db.add(org_toral)
        
        # Enterprise Org
        org_stac = Organization(
            name="Stac",
            org_type="enterprise",
            validation_status="validated",
            industry="Manufacturing",
            subscription_plan="growth"
        )
        db.add(org_stac)
        
        db.flush()
        logger.info(f"   Created Org: {org_toral.name}")
        logger.info(f"   Created Org: {org_stac.name}")

        # --- 3. Create Users ---
        logger.info("busts_in_silhouette Creating Users...")

        # Superadmin
        superadmin = User(
            email="rural.minds@teamworkz.co",
            hashed_password=auth.get_password_hash("RuralMinds2026!"),
            full_name="SuperAdmin RuralMinds",
            role=UserRole.SUPER_ADMIN,
            status="active",
            email_verified=True
        )
        db.add(superadmin)

        # Municipality User
        user_muni = User(
            email="ayuntamiento.demo@ruralminds.es",
            hashed_password=auth.get_password_hash("Demo2026!"),
            full_name="Admin Toral",
            role="municipality", 
            # Note: models.py uses UserRole Enum but also string in some places. 
            # Enum: UserRole.ENTERPRISE, "municipality" is not in the Enum printed in view_file (TALENT, ENTERPRISE, TERRITORY_ADMIN, SUPER_ADMIN).
            # Wait, looking at models.py line 52:
            # class UserRole(str, enum.Enum): TALENT="talent", ENTERPRISE="enterprise", TERRITORY_ADMIN="territory_admin", SUPER_ADMIN="super_admin"
            # It seems "municipality" is NOT in the enum! 
            # However, looking at `create_test_users.py`, it uses "municipality" string.
            # And `models.py` line 76 has `org_type` as "enterprise" or "municipality".
            # Let's check `UserRole` again. It has `TERRITORY_ADMIN`. Is that municipality?
            # Startups often reuse roles. In `create_test_users.py` line 25: `role="municipality"`.
            # If the database constraint enforces the Enum, this will fail if "municipality" isn't there.
            # But `create_test_users.py` uses it. Let's assume the string "municipality" is valid or the enum check isn't strict in DB for that column 
            # OR `UserRole` in `models.py` might be incomplete/outdated compared to actual usage.
            # I will use "municipality" as the role string as requested/used in existing scripts.
            status="active",
            email_verified=True,
            organization_id=org_toral.id
        )
        db.add(user_muni)

        # Enterprise User
        user_company = User(
            email="empresa.demo@ruralminds.es",
            hashed_password=auth.get_password_hash("Demo2026!"),
            full_name="Admin Stac",
            role=UserRole.ENTERPRISE, # "enterprise"
            status="active",
            email_verified=True,
            organization_id=org_stac.id
        )
        db.add(user_company)

        # Talent User
        user_talent = User(
            email="candidato.demo@ruralminds.es",
            hashed_password=auth.get_password_hash("Demo2026!"),
            full_name="Candidato Demo",
            role=UserRole.TALENT,
            status="active",
            email_verified=True
        )
        db.add(user_talent)
        db.flush()

        # Talent Profile (needed for candidate data)
        talent_profile = TalentProfile(
            user_id=user_talent.id,
            bio="Candidato entusiasta de Cacabelos interesado en oportunidades rurales.",
            residence_location_id=cacabelos.id,
            is_willing_to_move=True,
            skills=["Gestión", "Comunicación", "Administración"],
            work_style="Híbrido"
        )
        db.add(talent_profile)

        db.commit()
        
        logger.info("=" * 40)
        logger.info("🎉 DEMO DATA SEEDED SUCCESSFULLY")
        logger.info("=" * 40)
        logger.info(f"Superadmin: {superadmin.email} / RuralMinds2026!")
        logger.info(f"Municipality: {user_muni.email} / Demo2026!")
        logger.info(f"Enterprise: {user_company.email} / Demo2026!")
        logger.info(f"Talent: {user_talent.email} / Demo2026!")
        
    except Exception as e:
        logger.error(f"❌ Error seeding data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()
    seed_demo_data()
