
print("🚀 SCRIPT STARTING...")
import os
import sys

# Add backend to path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
print(f"📂 Backend directory identified as: {BACKEND_DIR}")
sys.path.insert(0, BACKEND_DIR)

print("🔍 Importing standard dependencies...")
try:
    import uuid
    from datetime import datetime
    from sqlalchemy.orm import Session, joinedload
    from pydantic import ValidationError
    print("✅ Standard dependencies imported.")
except Exception as e:
    print(f"❌ Error importing standard dependencies: {e}")
    sys.exit(1)

print("🔍 Importing project modules...")
try:
    # Force production DB URL for this script
    os.environ["DATABASE_URL"] = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!%23@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"
    
    import database
    import models
    import schemas
    print("✅ Project modules imported.")
except Exception as e:
    print(f"❌ Error importing project modules: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

def reproduce():
    print("🔌 Connecting to production DB...")
    try:
        db = next(database.get_db())
        print("✅ DB connection established.")
    except Exception as e:
        print(f"❌ DB connection failed: {e}")
        return
    
    email = "ayuntamiento.demo@ruralminds.es"
    print(f"🔍 Fetching user: {email}")
    
    try:
        user = db.query(models.User).options(
            joinedload(models.User.organization)
        ).filter(models.User.email == email).first()
    except Exception as e:
        print(f"❌ Query failed: {e}")
        db.close()
        return
    
    if not user:
        print("❌ User not found!")
        db.close()
        return
    
    print(f"✅ User found: {user.full_name} ({user.role})")
    print(f"🏢 Organization: {user.organization.name if user.organization else 'None'}")
    
    print("\n📦 Attempting serialization to UserPublic...")
    try:
        user_public = schemas.UserPublic.from_orm(user)
        print("✅ Serialization SUCCESSFUL!")
        print(user_public.json(indent=2))
    except ValidationError as e:
        print("❌ Serialization FAILED with ValidationError:")
        print(e.json(indent=2))
    except Exception as e:
        print("❌ Serialization FAILED with unexpected error:")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    reproduce()
    print("🏁 SCRIPT FINISHED.")
