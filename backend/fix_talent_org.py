import models
import database
from database import SessionLocal
import uuid

def fix_talent_org():
    print("🔍 Checking Talent User Organization...")
    db = SessionLocal()
    
    try:
        email = "talento@test.com"
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            print("❌ User 'talento@test.com' not found.")
            return

        print(f"👤 User found: {user.email}")
        print(f"🏢 Current Org ID: {user.organization_id}")

        if not user.organization_id:
            print("⚠️ User has NO Organization! Assigning to 'Teamworkz' or first available...")
            
            # Find an org
            org = db.query(models.Organization).filter(models.Organization.name == "Teamworkz").first()
            if not org:
                org = db.query(models.Organization).first()
                if not org:
                    # Create fallback org
                    print("⚠️ No organizations found. Creating 'Rural Minds Demo Org'...")
                    org = models.Organization(
                        id=uuid.uuid4(),
                        name="Rural Minds Demo Org",
                        subscription_plan="enterprise"
                    )
                    db.add(org)
                    db.commit()
            
            user.organization_id = org.id
            db.commit()
            print(f"✅ Assigned user to Organization: {org.name} ({org.id})")
        else:
            print("✅ User already has an Organization.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_talent_org()
