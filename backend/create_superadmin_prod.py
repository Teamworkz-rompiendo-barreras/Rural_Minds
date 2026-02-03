"""
Script to create superadmin in Supabase using pbkdf2_sha256 (pure Python).
No native extensions needed - works in all environments including Vercel serverless.
"""

import psycopg2
import uuid
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auth  # Uses pbkdf2_sha256 now

# Supabase Production Connection
DATABASE_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!#@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"

# Superadmin credentials
EMAIL = "rural.minds@teamworkz.co"
PASSWORD = "RuralMinds2026!"
FULL_NAME = "Super Administrador"

def create_superadmin():
    print(f"🔌 Connecting to Supabase Production...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        print("✅ Connected to Supabase")
        
        # Generate hash using auth module (pbkdf2_sha256)
        hashed_pwd = auth.get_password_hash(PASSWORD)
        print(f"📝 Generated pbkdf2_sha256 hash: {hashed_pwd[:40]}...")
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (EMAIL,))
        existing = cursor.fetchone()
        
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
            print(f"✅ Updated existing user: {EMAIL}")
        else:
            # Create new superadmin
            user_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO users (id, email, full_name, hashed_password, role, status, email_verified)
                VALUES (%s, %s, %s, %s, 'super_admin', 'active', true)
            """, (user_id, EMAIL, FULL_NAME, hashed_pwd))
            print(f"✅ Created new superadmin: {EMAIL}")
        
        conn.commit()
        
        # Verify
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
