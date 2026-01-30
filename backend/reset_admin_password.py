import models
import database
import auth
from database import SessionLocal

def reset_password():
    print("🔑 Resetting Admin Password...")
    
    # 1. Connect to DB (via dotenv loaded in database.py)
    db = SessionLocal()
    
    try:
        email = "admin_enterprise@test.com"
        new_password = "password123"
        hashed_pwd = auth.get_password_hash(new_password)
        
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if user:
            print(f"👤 User found: {user.email}")
            user.hashed_password = hashed_pwd
            db.commit()
            print(f"✅ Password UPDATED successfully for {email}")
        else:
            print(f"❌ User {email} NOT FOUND in database.")
            print("Running seed_enterprise_db.py first might be needed.")

    except Exception as e:
        print(f"❌ Error during reset: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_password()
