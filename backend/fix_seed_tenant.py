import models
import auth
import database
from database import SessionLocal

def fix_tenant():
    # Ensure tables exist
    models.Base.metadata.create_all(bind=database.engine)
    
    db = SessionLocal()
    try:
        # 1. Check if seed user exists
        email = "admin_seed@test.com"
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            print(f"User {email} not found. Creating it...")
            hashed_pwd = auth.get_password_hash("password123")
            user = models.User(email=email, hashed_password=hashed_pwd, role="super_admin")
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # 2. Check/Create Tenant
        target_name = "Teamworkz HQ"
        old_name = "Rural Minds HQ"
        
        # Check if old tenant exists and rename it
        old_tenant = db.query(models.Tenant).filter(models.Tenant.name == old_name).first()
        if old_tenant:
            print(f"Renaming '{old_name}' to '{target_name}'...")
            old_tenant.name = target_name
            db.commit()
            db.refresh(old_tenant)
            tenant = old_tenant
        else:
            tenant = db.query(models.Tenant).filter(models.Tenant.name == target_name).first()

        if not tenant:
            print(f"Creating Default Tenant '{target_name}'...")
            tenant = models.Tenant(
                name=target_name,
                industry="Inclusion Technology",
                size="11-50",
                subscription_plan="growth"
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
        else:
            print(f"Tenant '{tenant.name}' already exists (ID: {tenant.id})")

        # 3. Link User to Tenant
        if user.tenant_id != tenant.id:
            print(f"Linking User {user.email} -> Tenant {tenant.name}")
            user.tenant_id = tenant.id
            db.commit()
        else:
            print("User already linked to Tenant.")
            
        print("✅ Fix Complete.")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_tenant()
