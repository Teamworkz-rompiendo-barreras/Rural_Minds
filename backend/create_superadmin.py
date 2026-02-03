from sqlalchemy import create_engine, text
import auth

DB_URL = "sqlite:///./teamworkz.db"
EMAIL = "rural.minds@teamworkz.co"
PASSWORD = "RuralMinds2026!"  # Secure password

def create_or_update_superadmin():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        # Check if user exists
        result = conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": EMAIL})
        row = result.fetchone()
        
        hashed = auth.get_password_hash(PASSWORD)
        
        if row:
            # Update existing user to super_admin
            conn.execute(text("""
                UPDATE users 
                SET role = 'super_admin', 
                    hashed_password = :pwd,
                    email_verified = 1, 
                    status = 'active' 
                WHERE email = :email
            """), {"email": EMAIL, "pwd": hashed})
            print(f"✅ Updated {EMAIL} to super_admin")
        else:
            # Create new superadmin
            import uuid
            user_id = str(uuid.uuid4())
            conn.execute(text("""
                INSERT INTO users (id, email, full_name, hashed_password, role, status, email_verified)
                VALUES (:id, :email, 'Super Administrador', :pwd, 'super_admin', 'active', 1)
            """), {"id": user_id, "email": EMAIL, "pwd": hashed})
            print(f"✅ Created superadmin: {EMAIL}")
        
        conn.commit()
        print(f"🔑 Password: {PASSWORD}")
        print(f"🔗 Login at: https://rural-minds.vercel.app/login")

if __name__ == "__main__":
    create_or_update_superadmin()
