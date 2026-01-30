import models
import database
import auth
import uuid
from database import SessionLocal

def seed_enterprise():
    print("🌱 Seeding Enterprise Database (Teamworkz)...")
    
    # 1. Create Tables
    models.Base.metadata.create_all(bind=database.engine)
    db = SessionLocal()
    
    try:
        # 2. CRUD Organization (Teamworkz HQ)
        org_name = "Teamworkz HQ"
        org = db.query(models.Organization).filter(models.Organization.name == org_name).first()
        if not org:
            org = models.Organization(
                id=uuid.uuid4(),
                name=org_name,
                industry="Inclusion Tech",
                size="10-50",
                subscription_plan="enterprise",
                branding_logo_url="https://teamworkz.com/logo.png"
            )
            db.add(org)
            db.commit()
            db.refresh(org)
            print(f"✅ Created Org: {org.name} ({org.id})")
        
        # 3. CRUD Admin User
        email = "admin_enterprise@test.com"
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user = models.User(
                id=uuid.uuid4(),
                email=email,
                hashed_password=auth.get_password_hash("password123"),
                role="super_admin",
                organization_id=org.id,
                full_name="Teamworkz Admin"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"✅ Created User: {user.email} ({user.id})")
            
        # 4. CRUD Accessibility Profile
        profile = db.query(models.AccessibilityProfile).filter(models.AccessibilityProfile.user_id == user.id).first()
        if not profile:
            profile = models.AccessibilityProfile(
                id=uuid.uuid4(),
                user_id=user.id,
                prefers_reduced_motion=True,
                high_contrast_enabled=False,
                sensory_needs={"noise": "low"}
            )
            db.add(profile)
            db.commit()
            print(f"✅ Created Accessibility Profile for {user.full_name}")

        # 5. Seed Articles
        if db.query(models.Article).count() == 0:
            a1 = models.Article(title="Neurodiversity 101", summary="Intro", content="Content", author="Team", category="Education", id=uuid.uuid4())
            db.add(a1)
            db.commit()
            print("✅ Seeded Articles")

    except Exception as e:
        print(f"❌ Error during seed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_enterprise()
