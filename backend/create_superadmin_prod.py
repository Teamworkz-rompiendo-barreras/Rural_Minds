"""
Script to create superadmin in Supabase Production Database.

This creates:
1. User in 'users' table with role 'super_admin'
2. Ensures password hash is correct for login

Run with: python create_superadmin_prod.py
"""

import psycopg2
import uuid
import sys
import os

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import auth  # Use existing auth module

# Supabase Production Connection
DATABASE_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!#@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"

# Superadmin credentials
EMAIL = "rural.minds@teamworkz.co"
PASSWORD = "RuralMinds2026!"
FULL_NAME = "Super Administrador"

def get_password_hash(password: str) -> str:
    """Use existing auth module for password hashing."""
    return auth.get_password_hash(password)

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
