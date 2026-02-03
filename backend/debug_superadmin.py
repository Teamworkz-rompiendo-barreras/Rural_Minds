"""
Debug script to verify superadmin in Supabase production.
"""

import psycopg2
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auth

DATABASE_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!#@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"
EMAIL = "rural.minds@teamworkz.co"
PASSWORD = "RuralMinds2026!"

def debug():
    print("🔌 Connecting to Supabase Production...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    print("✅ Connected")
    
    # Check if user exists
    cursor.execute("SELECT id, email, role, status, email_verified, hashed_password FROM users WHERE email = %s", (EMAIL,))
    user = cursor.fetchone()
    
    if user:
        print(f"\n📋 User Found:")
        print(f"   ID: {user[0]}")
        print(f"   Email: {user[1]}")
        print(f"   Role: {user[2]}")
        print(f"   Status: {user[3]}")
        print(f"   Email Verified: {user[4]}")
        print(f"   Password Hash (first 30 chars): {user[5][:30] if user[5] else 'NONE'}...")
        
        # Verify password
        if user[5]:
            try:
                is_valid = auth.verify_password(PASSWORD, user[5])
                print(f"\n🔐 Password Verification: {'✅ VALID' if is_valid else '❌ INVALID'}")
            except Exception as e:
                print(f"\n❌ Password verification error: {e}")
        else:
            print(f"\n❌ No password hash stored!")
    else:
        print(f"\n❌ User NOT FOUND: {EMAIL}")
        
        # List all users to debug
        cursor.execute("SELECT email, role, status FROM users LIMIT 10")
        users = cursor.fetchall()
        print(f"\n📋 Existing users ({len(users)}):")
        for u in users:
            print(f"   {u[0]} | {u[1]} | {u[2]}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    debug()
