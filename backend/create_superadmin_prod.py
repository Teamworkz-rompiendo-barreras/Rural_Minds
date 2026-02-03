"""
Script to create superadmin in Supabase Production Database.
Uses direct bcrypt hashing to avoid passlib compatibility issues.
"""

import psycopg2
import uuid
import bcrypt

# Supabase Production Connection
DATABASE_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!#@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"

# Superadmin credentials
EMAIL = "rural.minds@teamworkz.co"
PASSWORD = "RuralMinds2026!"
FULL_NAME = "Super Administrador"

def get_password_hash(password: str) -> str:
    """Hash password using bcrypt directly."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_superadmin():
    print(f"🔌 Connecting to Supabase Production...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        print("✅ Connected to Supabase")
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (EMAIL,))
        existing = cursor.fetchone()
        
        hashed_pwd = get_password_hash(PASSWORD)
        print(f"📝 Generated bcrypt hash: {hashed_pwd[:30]}...")
        
        user_id = str(uuid.uuid4())
        
        if existing:
            # Update existing user
            cursor.execute("""
                UPDATE users 
                SET role = 'super_admin',
                    hashed_password = %s,
                    email_verified = true,
                    status = 'active',
                    full_name = %s
                WHERE email = %s
            """, (hashed_pwd, FULL_NAME, EMAIL))
            print(f"✅ Updated existing user to super_admin: {EMAIL}")
        else:
            # Create new superadmin
            cursor.execute("""
                INSERT INTO users (id, email, full_name, hashed_password, role, status, email_verified)
                VALUES (%s, %s, %s, %s, 'super_admin', 'active', true)
            """, (user_id, EMAIL, FULL_NAME, hashed_pwd))
            print(f"✅ Created new superadmin: {EMAIL}")
        
        conn.commit()
        
        # Verify the user was created/updated
        cursor.execute("SELECT id, email, role, status FROM users WHERE email = %s", (EMAIL,))
        user = cursor.fetchone()
        
        if user:
            print(f"\n📋 User Details:")
            print(f"   ID: {user[0]}")
            print(f"   Email: {user[1]}")
            print(f"   Role: {user[2]}")
            print(f"   Status: {user[3]}")
            print(f"\n🔑 Login Credentials:")
            print(f"   Email: {EMAIL}")
            print(f"   Password: {PASSWORD}")
            print(f"   URL: https://rural-minds.vercel.app/login")
        
        cursor.close()
        conn.close()
        print("\n✅ Done!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise

if __name__ == "__main__":
    create_superadmin()
