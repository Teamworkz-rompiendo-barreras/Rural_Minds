
import psycopg2
import sys
import os

# Supabase Production Connection
DATABASE_URL = "postgresql://postgres.yfwysmurnfejowjgxdzi:kLAZdfai834!#@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require"

EMAIL_TO_CHECK = "test.invite.debug@teamworkz.co"

def check_invitation():
    print(f"🔌 Connecting to Supabase Production...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        print("✅ Connected")
        
        cursor.execute("SELECT id, email, status, token FROM invitations WHERE email = %s", (EMAIL_TO_CHECK,))
        invite = cursor.fetchone()
        
        if invite:
            print(f"✅ Invitation FOUND in DB!")
            print(f"   ID: {invite[0]}")
            print(f"   Status: {invite[2]}")
            print("   (Crash happened AFTER DB commit)")
        else:
            print(f"❌ Invitation NOT found in DB.")
            print("   (Crash happened BEFORE or DURING DB commit)")
            
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_invitation()
