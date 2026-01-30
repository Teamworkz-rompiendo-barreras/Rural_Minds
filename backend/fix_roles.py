import models
import database
import auth
from database import SessionLocal
import uuid

def fix_roles():
    print("🔧 Fixing Roles & Creating Users...")
    db = SessionLocal()
    
    try:
        # 1. Fix Enterprise User (Downgrade to enterprise role)
        enterprise_email = "admin_enterprise@test.com"
        ent_user = db.query(models.User).filter(models.User.email == enterprise_email).first()
        if ent_user:
            ent_user.role = "enterprise"
            db.commit()
            print(f"✅ Updated {enterprise_email} to role 'enterprise'")
        else:
            print(f"⚠️ {enterprise_email} not found")

        # 2. Create Real Super Admin (Teamworkz Team)
        super_email = "teamworkz@admin.com"
        admin_user = db.query(models.User).filter(models.User.email == super_email).first()
        
        # Get Teamworkz Org ID (assuming it exists from previous seed or create new generic)
        org = db.query(models.Organization).first() # Assign to first org for now logic
        
        if not admin_user:
            new_admin = models.User(
                id=uuid.uuid4(),
                email=super_email,
                full_name="Teamworkz Superadmin",
                hashed_password=auth.get_password_hash("password123"),
                role="super_admin",
                organization_id=org.id if org else None
            )
            db.add(new_admin)
            db.commit()
            print(f"✅ Created Super Admin: {super_email} (password123)")
        else:
            print(f"ℹ️ {super_email} already exists")

        # 3. Create Talent User (Collaborator)
        talent_email = "talento@test.com"
        talent_user = db.query(models.User).filter(models.User.email == talent_email).first()
        if not talent_user:
            new_talent = models.User(
                id=uuid.uuid4(),
                email=talent_email,
                full_name="Talento Demo",
                hashed_password=auth.get_password_hash("password123"),
                role="talent",
                organization_id=org.id if org else None
            )
            db.add(new_talent)
            db.commit()
            print(f"✅ Created Talent: {talent_email} (password123)")
        else:
             print(f"ℹ️ {talent_email} already exists")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_roles()
